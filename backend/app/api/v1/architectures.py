import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Architecture, Project, User
from app.ml.schema import ArchitectureGraph, ValidationResult
from app.ml.validator import ArchitectureValidator
from app.ml.code_gen import PyTorchCodeGenerator
from app.ml.registry import LAYER_REGISTRY
from app.api.deps import get_current_user, record_audit

router = APIRouter(prefix="/architectures", tags=["Architectures"])


class ArchitectureSaveRequest(BaseModel):
    project_id: str
    name: str
    version: Optional[str] = "1.0.0"
    description: Optional[str] = ""
    task: str = "classification"
    graph: ArchitectureGraph


class ArchitectureResponse(BaseModel):
    id: str
    project_id: str
    name: str
    version: str
    description: Optional[str]
    task: str
    input_shape: List[int]
    num_classes: int
    total_params: int
    trainable_params: int
    is_valid: bool
    graph: Dict[str, Any]
    created_at: str


@router.get("/catalog")
def get_layer_catalog():
    """
    Returns supported layer catalog with parameters, types, defaults, and categories.
    """
    return LAYER_REGISTRY


@router.post("/validate", response_model=ValidationResult)
def validate_architecture(graph: ArchitectureGraph):
    """
    Validates graph connectivity, cycles, computes layer-by-layer shapes and parameter counts.
    """
    result = ArchitectureValidator.validate_graph(graph)
    return result


@router.post("/generate-code")
def generate_pytorch_code(graph: ArchitectureGraph):
    """
    Generates runnable, clean PyTorch code for the given architecture graph.
    """
    code = PyTorchCodeGenerator.generate(graph)
    return {"code": code}


@router.get("", response_model=List[ArchitectureResponse])
def list_architectures(
    project_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Architecture)
    if project_id:
        query = query.filter(Architecture.project_id == project_id)
    archs = query.all()

    res = []
    for a in archs:
        try:
            g_dict = json.loads(a.graph_json)
        except Exception:
            g_dict = {}
        res.append({
            "id": a.id,
            "project_id": a.project_id,
            "name": a.name,
            "version": a.version,
            "description": a.description,
            "task": a.task,
            "input_shape": json.loads(a.input_shape_json) if a.input_shape_json else [1, 28, 28],
            "num_classes": a.num_classes or 10,
            "total_params": a.total_params or 0,
            "trainable_params": a.trainable_params or 0,
            "is_valid": a.is_valid,
            "graph": g_dict,
            "created_at": a.created_at.isoformat() if a.created_at else "",
        })
    return res


@router.get("/{id}", response_model=ArchitectureResponse)
def get_architecture(id: str, db: Session = Depends(get_db)):
    a = db.query(Architecture).filter(Architecture.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Architecture not found")

    return {
        "id": a.id,
        "project_id": a.project_id,
        "name": a.name,
        "version": a.version,
        "description": a.description,
        "task": a.task,
        "input_shape": json.loads(a.input_shape_json) if a.input_shape_json else [1, 28, 28],
        "num_classes": a.num_classes or 10,
        "total_params": a.total_params or 0,
        "trainable_params": a.trainable_params or 0,
        "is_valid": a.is_valid,
        "graph": json.loads(a.graph_json),
        "created_at": a.created_at.isoformat() if a.created_at else "",
    }


@router.post("", response_model=ArchitectureResponse)
def save_architecture(
    req: ArchitectureSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    val_res = ArchitectureValidator.validate_graph(req.graph)

    arch = Architecture(
        project_id=req.project_id,
        name=req.name,
        version=req.version or "1.0.0",
        description=req.description,
        task=req.task,
        input_shape_json=json.dumps(req.graph.input_shape),
        num_classes=req.graph.num_classes or 10,
        graph_json=req.graph.model_dump_json(),
        total_params=val_res.total_parameters,
        trainable_params=val_res.trainable_parameters,
        is_valid=val_res.is_valid,
        validation_errors_json=json.dumps(val_res.errors),
        created_by=current_user.id,
    )
    db.add(arch)
    db.commit()
    db.refresh(arch)

    record_audit(db, "CREATE_ARCHITECTURE", "architecture", arch.id, current_user.id, project.workspace_id)

    return {
        "id": arch.id,
        "project_id": arch.project_id,
        "name": arch.name,
        "version": arch.version,
        "description": arch.description,
        "task": arch.task,
        "input_shape": req.graph.input_shape,
        "num_classes": req.graph.num_classes or 10,
        "total_params": arch.total_params,
        "trainable_params": arch.trainable_params,
        "is_valid": arch.is_valid,
        "graph": req.graph.model_dump(),
        "created_at": arch.created_at.isoformat(),
    }


@router.put("/{id}", response_model=ArchitectureResponse)
def update_architecture(
    id: str,
    req: ArchitectureSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    arch = db.query(Architecture).filter(Architecture.id == id).first()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")

    val_res = ArchitectureValidator.validate_graph(req.graph)

    arch.name = req.name
    arch.version = req.version or arch.version
    arch.description = req.description
    arch.task = req.task
    arch.input_shape_json = json.dumps(req.graph.input_shape)
    arch.num_classes = req.graph.num_classes or 10
    arch.graph_json = req.graph.model_dump_json()
    arch.total_params = val_res.total_parameters
    arch.trainable_params = val_res.trainable_parameters
    arch.is_valid = val_res.is_valid
    arch.validation_errors_json = json.dumps(val_res.errors)

    db.commit()
    db.refresh(arch)

    return {
        "id": arch.id,
        "project_id": arch.project_id,
        "name": arch.name,
        "version": arch.version,
        "description": arch.description,
        "task": arch.task,
        "input_shape": req.graph.input_shape,
        "num_classes": req.graph.num_classes or 10,
        "total_params": arch.total_params,
        "trainable_params": arch.trainable_params,
        "is_valid": arch.is_valid,
        "graph": req.graph.model_dump(),
        "created_at": arch.created_at.isoformat(),
    }
