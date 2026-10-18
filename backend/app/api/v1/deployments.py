import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Deployment, ModelRecord, Architecture, DatasetModel, User
from app.ml.schema import ArchitectureGraph
from app.ml.inference_engine import DeploymentInferenceEngine
from app.api.deps import get_current_user, record_audit, require_role

router = APIRouter(prefix="/deployments", tags=["Deployments"])


class DeploymentCreate(BaseModel):
    model_id: str
    name: str
    endpoint_path: str


class DeploymentResponse(BaseModel):
    id: str
    model_id: str
    name: str
    endpoint_path: str
    status: str
    latency_p50: float
    latency_p95: float
    request_count: int
    created_at: str


@router.get("", response_model=List[DeploymentResponse])
def list_deployments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deployments = db.query(Deployment).order_by(Deployment.created_at.desc()).all()
    return [
        {
            "id": d.id,
            "model_id": d.model_id,
            "name": d.name,
            "endpoint_path": d.endpoint_path,
            "status": d.status,
            "latency_p50": d.latency_p50 or 0.0,
            "latency_p95": d.latency_p95 or 0.0,
            "request_count": d.request_count or 0,
            "created_at": d.created_at.isoformat() if d.created_at else "",
        }
        for d in deployments
    ]


@router.post("", response_model=DeploymentResponse)
def create_deployment(
    req: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["owner", "admin", "ml_engineer"])),
):
    model_rec = db.query(ModelRecord).filter(ModelRecord.id == req.model_id).first()
    if not model_rec:
        raise HTTPException(status_code=404, detail="Model record not found")

    if model_rec.stage not in ("approved", "evaluated"):
        raise HTTPException(
            status_code=400,
            detail=f"Deployment Gate Failed: Only 'approved' or 'evaluated' models can be deployed (current stage: {model_rec.stage}).",
        )

    # Check endpoint uniqueness
    existing = db.query(Deployment).filter(Deployment.endpoint_path == req.endpoint_path).first()
    if existing:
        raise HTTPException(status_code=400, detail="Deployment with this endpoint path already exists")

    # Warm-up and benchmark the model
    arch = db.query(Architecture).filter(Architecture.id == model_rec.architecture_id).first()
    graph = ArchitectureGraph(**json.loads(arch.graph_json))

    engine = DeploymentInferenceEngine(
        checkpoint_path=model_rec.checkpoint_path,
        architecture_graph=graph,
    )
    try:
        engine.load_and_warmup(warmup_runs=3)
        bench = engine.benchmark(num_requests=20)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=f"Model warm-up failed: {str(ex)}")

    dep = Deployment(
        model_id=req.model_id,
        name=req.name,
        endpoint_path=req.endpoint_path,
        status="active",
        latency_p50=bench["p50_latency_ms"],
        latency_p95=bench["p95_latency_ms"],
    )
    db.add(dep)

    model_rec.stage = "deployed"
    db.commit()
    db.refresh(dep)

    record_audit(db, "DEPLOY_MODEL", "deployment", dep.id, current_user.id)

    return {
        "id": dep.id,
        "model_id": dep.model_id,
        "name": dep.name,
        "endpoint_path": dep.endpoint_path,
        "status": dep.status,
        "latency_p50": dep.latency_p50,
        "latency_p95": dep.latency_p95,
        "request_count": dep.request_count,
        "created_at": dep.created_at.isoformat(),
    }


@router.post("/{id}/benchmark")
def benchmark_deployment(id: str, db: Session = Depends(get_db)):
    dep = db.query(Deployment).filter(Deployment.id == id).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")

    model_rec = db.query(ModelRecord).filter(ModelRecord.id == dep.model_id).first()
    arch = db.query(Architecture).filter(Architecture.id == model_rec.architecture_id).first()
    graph = ArchitectureGraph(**json.loads(arch.graph_json))

    engine = DeploymentInferenceEngine(
        checkpoint_path=model_rec.checkpoint_path,
        architecture_graph=graph,
    )
    engine.load_and_warmup(warmup_runs=3)
    bench = engine.benchmark(num_requests=40)

    dep.latency_p50 = bench["p50_latency_ms"]
    dep.latency_p95 = bench["p95_latency_ms"]
    db.commit()

    return bench


@router.post("/{id}/rollback")
def rollback_deployment(
    id: str,
    target_model_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["owner", "admin"])),
):
    dep = db.query(Deployment).filter(Deployment.id == id).first()
    if not dep:
        raise HTTPException(status_code=404, detail="Deployment not found")

    target_model = db.query(ModelRecord).filter(ModelRecord.id == target_model_id).first()
    if not target_model:
        raise HTTPException(status_code=404, detail="Target rollback model not found")

    # Update deployment pointer
    old_model_id = dep.model_id
    dep.model_id = target_model_id
    dep.status = "active"
    db.commit()

    record_audit(
        db,
        "ROLLBACK_DEPLOYMENT",
        "deployment",
        dep.id,
        current_user.id,
        details={"from_model": old_model_id, "to_model": target_model_id},
    )

    return {"message": f"Successfully rolled back deployment to model version {target_model.version}"}
