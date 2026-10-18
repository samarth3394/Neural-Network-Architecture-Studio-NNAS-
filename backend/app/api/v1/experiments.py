import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Experiment, TrainingJob, Architecture, User
from app.api.deps import get_current_user

router = APIRouter(prefix="/experiments", tags=["Experiments"])


class ExperimentResponse(BaseModel):
    id: str
    project_id: str
    name: str
    notes: Optional[str]
    training_job_id: str
    architecture_id: str
    metrics_summary: Dict[str, Any]
    created_at: str


class CompareRequest(BaseModel):
    experiment_ids: List[str]


@router.get("", response_model=List[ExperimentResponse])
def list_experiments(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Experiment)
    if project_id:
        query = query.filter(Experiment.project_id == project_id)
    experiments = query.order_by(Experiment.created_at.desc()).all()

    return [
        {
            "id": e.id,
            "project_id": e.project_id,
            "name": e.name,
            "notes": e.notes,
            "training_job_id": e.training_job_id,
            "architecture_id": e.architecture_id,
            "metrics_summary": json.loads(e.metrics_summary_json) if e.metrics_summary_json else {},
            "created_at": e.created_at.isoformat() if e.created_at else "",
        }
        for e in experiments
    ]


@router.post("/compare")
def compare_experiments(
    req: CompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    experiments = db.query(Experiment).filter(Experiment.id.in_(req.experiment_ids)).all()
    comparison_data = []

    for exp in experiments:
        job = db.query(TrainingJob).filter(TrainingJob.id == exp.training_job_id).first()
        arch = db.query(Architecture).filter(Architecture.id == exp.architecture_id).first()

        metrics_hist = json.loads(job.metrics_json) if job and job.metrics_json else []
        eval_dict = json.loads(job.evaluation_json) if job and job.evaluation_json else {}

        comparison_data.append({
            "experiment_id": exp.id,
            "experiment_name": exp.name,
            "architecture_name": arch.name if arch else "Unknown",
            "total_parameters": arch.total_params if arch else 0,
            "trainable_parameters": arch.trainable_params if arch else 0,
            "duration_seconds": job.duration_seconds if job else 0.0,
            "best_val_loss": job.best_val_loss if job else None,
            "test_accuracy": eval_dict.get("accuracy"),
            "test_mse": eval_dict.get("mse"),
            "metrics_history": metrics_hist,
        })

    return {"experiments": comparison_data}
