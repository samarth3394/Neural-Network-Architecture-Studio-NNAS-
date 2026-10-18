import json
import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ModelRecord, Project, Architecture, TrainingJob, User
from app.api.deps import get_current_user, record_audit, require_role

router = APIRouter(prefix="/registry", tags=["Model Registry"])


class ModelRecordResponse(BaseModel):
    id: str
    project_id: str
    architecture_id: str
    training_job_id: Optional[str]
    name: str
    version: str
    stage: str
    metrics: Dict[str, Any]
    checkpoint_path: Optional[str]
    approval_notes: Optional[str]
    created_at: str


class StageTransitionRequest(BaseModel):
    stage: str  # draft, trained, evaluated, approved, deployed, archived
    approval_notes: Optional[str] = None


@router.get("/models", response_model=List[ModelRecordResponse])
def list_models(
    project_id: Optional[str] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ModelRecord)
    if project_id:
        query = query.filter(ModelRecord.project_id == project_id)
    if stage:
        query = query.filter(ModelRecord.stage == stage)
    models = query.order_by(ModelRecord.created_at.desc()).all()

    return [
        {
            "id": m.id,
            "project_id": m.project_id,
            "architecture_id": m.architecture_id,
            "training_job_id": m.training_job_id,
            "name": m.name,
            "version": m.version,
            "stage": m.stage,
            "metrics": json.loads(m.metrics_json) if m.metrics_json else {},
            "checkpoint_path": m.checkpoint_path,
            "approval_notes": m.approval_notes,
            "created_at": m.created_at.isoformat() if m.created_at else "",
        }
        for m in models
    ]


@router.post("/models/{id}/transition-stage", response_model=ModelRecordResponse)
def transition_stage(
    id: str,
    req: StageTransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["owner", "admin", "ml_engineer"])),
):
    model = db.query(ModelRecord).filter(ModelRecord.id == id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model record not found")

    allowed_stages = ["draft", "trained", "evaluated", "approved", "deployed", "archived"]
    target_stage = req.stage.lower()
    if target_stage not in allowed_stages:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Allowed: {allowed_stages}")

    # Validation gates before approval/deployment:
    if target_stage in ("approved", "deployed"):
        if not model.checkpoint_path or not os.path.exists(model.checkpoint_path):
            raise HTTPException(
                status_code=400,
                detail="Validation Gate Failed: Model cannot be approved or deployed without a verified physical checkpoint file.",
            )
        metrics = json.loads(model.metrics_json) if model.metrics_json else {}
        if not metrics or ("accuracy" not in metrics and "mse" not in metrics):
            raise HTTPException(
                status_code=400,
                detail="Validation Gate Failed: Model cannot be approved without verified evaluation metrics on held-out test data.",
            )

    model.stage = target_stage
    if req.approval_notes:
        model.approval_notes = req.approval_notes
    if target_stage == "approved":
        model.approved_by = current_user.id

    db.commit()
    db.refresh(model)

    record_audit(db, "TRANSITION_MODEL_STAGE", "model_record", model.id, current_user.id, details={"to_stage": target_stage})

    return {
        "id": model.id,
        "project_id": model.project_id,
        "architecture_id": model.architecture_id,
        "training_job_id": model.training_job_id,
        "name": model.name,
        "version": model.version,
        "stage": model.stage,
        "metrics": json.loads(model.metrics_json) if model.metrics_json else {},
        "checkpoint_path": model.checkpoint_path,
        "approval_notes": model.approval_notes,
        "created_at": model.created_at.isoformat() if model.created_at else "",
    }
