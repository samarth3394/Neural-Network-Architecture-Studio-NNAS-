import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import TrainingJob, Architecture, DatasetModel, Project, User
from app.workers.queue import job_manager
from app.api.deps import get_current_user, record_audit

router = APIRouter(prefix="/training", tags=["Training"])


class TrainingJobSubmit(BaseModel):
    project_id: str
    architecture_id: str
    dataset_id: str
    epochs: int = 10
    batch_size: int = 32
    learning_rate: float = 0.001
    optimizer: str = "adam"  # adam, sgd, adamw, rmsprop
    loss: str = "cross_entropy"
    weight_decay: float = 1e-4
    early_stopping_patience: int = 5
    random_seed: int = 42


class TrainingJobResponse(BaseModel):
    id: str
    project_id: str
    architecture_id: str
    dataset_id: str
    status: str
    current_epoch: int
    total_epochs: int
    best_val_loss: Optional[float]
    best_epoch: Optional[int]
    duration_seconds: float
    metrics_history: List[Dict[str, Any]]
    logs: List[str]
    evaluation: Dict[str, Any]
    error_message: Optional[str]
    created_at: str


@router.post("/jobs", response_model=TrainingJobResponse)
def submit_training_job(
    req: TrainingJobSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    arch = db.query(Architecture).filter(Architecture.id == req.architecture_id).first()
    if not arch or not arch.is_valid:
        raise HTTPException(status_code=400, detail="Valid architecture required for training")

    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    config_dict = {
        "epochs": req.epochs,
        "batch_size": req.batch_size,
        "learning_rate": req.learning_rate,
        "optimizer": req.optimizer,
        "loss": req.loss,
        "weight_decay": req.weight_decay,
        "early_stopping_patience": req.early_stopping_patience,
        "random_seed": req.random_seed,
    }

    job = TrainingJob(
        project_id=req.project_id,
        architecture_id=req.architecture_id,
        dataset_id=req.dataset_id,
        status="QUEUED",
        total_epochs=req.epochs,
        config_json=json.dumps(config_dict),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Dispatch to background thread worker
    job_manager.submit_training_job(job.id)

    record_audit(db, "START_TRAINING_JOB", "training_job", job.id, current_user.id, project.workspace_id)

    return _format_job(job)


@router.get("/jobs", response_model=List[TrainingJobResponse])
def list_training_jobs(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(TrainingJob)
    if project_id:
        query = query.filter(TrainingJob.project_id == project_id)
    jobs = query.order_by(TrainingJob.created_at.desc()).all()
    return [_format_job(j) for j in jobs]


@router.get("/jobs/{id}", response_model=TrainingJobResponse)
def get_training_job(id: str, db: Session = Depends(get_db)):
    job = db.query(TrainingJob).filter(TrainingJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")

    # If currently active, merge live memory metrics
    active_info = job_manager.active_jobs.get(id)
    if active_info and job.status == "RUNNING":
        return {
            "id": job.id,
            "project_id": job.project_id,
            "architecture_id": job.architecture_id,
            "dataset_id": job.dataset_id,
            "status": job.status,
            "current_epoch": active_info.get("current_epoch", job.current_epoch),
            "total_epochs": job.total_epochs,
            "best_val_loss": job.best_val_loss,
            "best_epoch": job.best_epoch,
            "duration_seconds": job.duration_seconds,
            "metrics_history": active_info.get("metrics_history", []),
            "logs": json.loads(job.logs_json) if job.logs_json else [],
            "evaluation": json.loads(job.evaluation_json) if job.evaluation_json else {},
            "error_message": job.error_message,
            "created_at": job.created_at.isoformat() if job.created_at else "",
        }

    return _format_job(job)


@router.post("/jobs/{id}/cancel")
def cancel_job(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = job_manager.cancel_job(id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to cancel job (may already be finished)")
    return {"message": "Cancellation request submitted"}


@router.post("/jobs/{id}/pause")
def pause_job(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = job_manager.pause_job(id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to pause job")
    return {"message": "Job paused"}


@router.post("/jobs/{id}/resume")
def resume_job(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = job_manager.resume_job(id)
    if not success:
        raise HTTPException(status_code=400, detail="Unable to resume job")
    return {"message": "Job resumed"}


def _format_job(j: TrainingJob) -> Dict[str, Any]:
    return {
        "id": j.id,
        "project_id": j.project_id,
        "architecture_id": j.architecture_id,
        "dataset_id": j.dataset_id,
        "status": j.status,
        "current_epoch": j.current_epoch or 0,
        "total_epochs": j.total_epochs or 10,
        "best_val_loss": j.best_val_loss,
        "best_epoch": j.best_epoch,
        "duration_seconds": j.duration_seconds or 0.0,
        "metrics_history": json.loads(j.metrics_json) if j.metrics_json else [],
        "logs": json.loads(j.logs_json) if j.logs_json else [],
        "evaluation": json.loads(j.evaluation_json) if j.evaluation_json else {},
        "error_message": j.error_message,
        "created_at": j.created_at.isoformat() if j.created_at else "",
    }
