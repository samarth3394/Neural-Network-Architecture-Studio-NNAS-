import json
import os
import threading
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.db.models import OptimizationJob, Architecture, DatasetModel, Project, User
from app.ml.schema import ArchitectureGraph
from app.ml.datasets import DatasetManager
from app.ml.optimizer_search import ArchitectureOptimizerService
from app.core.config import settings
from app.api.deps import get_current_user, record_audit

router = APIRouter(prefix="/optimization", tags=["Architecture Optimization"])


class OptimizationSubmit(BaseModel):
    project_id: str
    base_architecture_id: str
    dataset_id: str
    max_trials: int = 4
    timeout_seconds: int = 180
    max_parameters: int = 1000000
    trial_epochs: int = 2
    strategy: str = "evolutionary_mutation"  # evolutionary_mutation, random


class OptimizationJobResponse(BaseModel):
    id: str
    project_id: str
    base_architecture_id: str
    dataset_id: str
    status: str
    duration_seconds: float
    best_candidate: Dict[str, Any]
    pareto_frontier: List[Dict[str, Any]]
    all_trials: List[Dict[str, Any]]
    created_at: str


def _run_optimization_background(job_id: str):
    db = SessionLocal()
    try:
        job = db.query(OptimizationJob).filter(OptimizationJob.id == job_id).first()
        if not job:
            return

        arch_db = db.query(Architecture).filter(Architecture.id == job.base_architecture_id).first()
        dataset_db = db.query(DatasetModel).filter(DatasetModel.id == job.dataset_id).first()

        if not arch_db or not dataset_db:
            job.status = "FAILED"
            db.commit()
            return

        job.status = "RUNNING"
        db.commit()

        base_graph = ArchitectureGraph(**json.loads(arch_db.graph_json))
        config = json.loads(job.config_json)

        schema_info = json.loads(dataset_db.schema_json) if dataset_db.schema_json else {}
        data = DatasetManager.get_dataset(
            dataset_name=dataset_db.dataset_type,
            batch_size=32,
            csv_path=dataset_db.file_path,
            image_size=schema_info.get("image_size"),
            color_mode=schema_info.get("color_mode"),
        )

        ckpt_dir = os.path.join(settings.LOCAL_STORAGE_DIR, "nas", job.id)
        is_classification = dataset_db.num_classes > 1 and base_graph.task == "classification"

        search_res = ArchitectureOptimizerService.run_architecture_search(
            base_graph=base_graph,
            train_loader=data["train_loader"],
            val_loader=data["val_loader"],
            test_loader=data["test_loader"],
            search_config=config,
            checkpoint_base_dir=ckpt_dir,
            is_classification=is_classification,
        )

        job.status = "SUCCEEDED"
        job.duration_seconds = search_res["total_search_duration_seconds"]
        job.best_candidate_json = json.dumps(search_res["best_candidate"])
        job.pareto_frontier_json = json.dumps(search_res["pareto_frontier"])
        job.all_trials_json = json.dumps(search_res["all_trials"])
        db.commit()

    except Exception as e:
        try:
            job.status = "FAILED"
            db.commit()
        except Exception:
            pass
    finally:
        db.close()


@router.post("/jobs", response_model=OptimizationJobResponse)
def submit_optimization_job(
    req: OptimizationSubmit,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    arch = db.query(Architecture).filter(Architecture.id == req.base_architecture_id).first()
    if not arch:
        raise HTTPException(status_code=404, detail="Base architecture not found")

    dataset = db.query(DatasetModel).filter(DatasetModel.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    config_dict = {
        "max_trials": req.max_trials,
        "timeout_seconds": req.timeout_seconds,
        "max_parameters": req.max_parameters,
        "trial_epochs": req.trial_epochs,
        "strategy": req.strategy,
    }

    job = OptimizationJob(
        project_id=req.project_id,
        base_architecture_id=req.base_architecture_id,
        dataset_id=req.dataset_id,
        status="QUEUED",
        config_json=json.dumps(config_dict),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Launch background optimization
    background_tasks.add_task(_run_optimization_background, job.id)

    record_audit(db, "START_OPTIMIZATION_JOB", "optimization_job", job.id, current_user.id, project.workspace_id)

    return _format_nas_job(job)


@router.get("/jobs", response_model=List[OptimizationJobResponse])
def list_optimization_jobs(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(OptimizationJob)
    if project_id:
        query = query.filter(OptimizationJob.project_id == project_id)
    jobs = query.order_by(OptimizationJob.created_at.desc()).all()
    return [_format_nas_job(j) for j in jobs]


@router.get("/jobs/{id}", response_model=OptimizationJobResponse)
def get_optimization_job(id: str, db: Session = Depends(get_db)):
    job = db.query(OptimizationJob).filter(OptimizationJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Optimization job not found")
    return _format_nas_job(job)


def _format_nas_job(j: OptimizationJob) -> Dict[str, Any]:
    return {
        "id": j.id,
        "project_id": j.project_id,
        "base_architecture_id": j.base_architecture_id,
        "dataset_id": j.dataset_id,
        "status": j.status,
        "duration_seconds": j.duration_seconds or 0.0,
        "best_candidate": json.loads(j.best_candidate_json) if j.best_candidate_json else {},
        "pareto_frontier": json.loads(j.pareto_frontier_json) if j.pareto_frontier_json else [],
        "all_trials": json.loads(j.all_trials_json) if j.all_trials_json else [],
        "created_at": j.created_at.isoformat() if j.created_at else "",
    }
