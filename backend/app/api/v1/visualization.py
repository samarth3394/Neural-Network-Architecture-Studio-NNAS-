import json
import os
import torch
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Architecture, ModelRecord
from app.ml.schema import ArchitectureGraph
from app.ml.compiler import ModelCompiler
from app.ml.hooks import ModelInspectionHooks
from app.ml.explainability import ModelExplainability

router = APIRouter(prefix="/visualization", tags=["Visualization & Explainability"])


class LayerActivationsRequest(BaseModel):
    architecture_id: str
    sample_input: Optional[List[Any]] = None


@router.post("/activations")
def get_layer_activations(req: LayerActivationsRequest, db: Session = Depends(get_db)):
    arch = db.query(Architecture).filter(Architecture.id == req.architecture_id).first()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")

    graph = ArchitectureGraph(**json.loads(arch.graph_json))
    model = ModelCompiler.compile(graph)

    # If checkpoint exists, try to load it
    model_rec = db.query(ModelRecord).filter(ModelRecord.architecture_id == arch.id).order_by(ModelRecord.created_at.desc()).first()
    if model_rec and model_rec.checkpoint_path and os.path.exists(model_rec.checkpoint_path):
        ckpt = torch.load(model_rec.checkpoint_path, map_location="cpu", weights_only=False)
        model.load_state_dict(ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt)

    # Generate or parse sample input
    if req.sample_input:
        inp = torch.tensor(req.sample_input, dtype=torch.float32)
    else:
        sample_shape = [1] + list(graph.input_shape)
        inp = torch.randn(sample_shape, dtype=torch.float32)

    activations = ModelInspectionHooks.inspect_sample_forward(model, inp, max_neurons=128)
    return {"layer_activations": activations}


@router.get("/weights/{architecture_id}")
def get_model_weight_distributions(architecture_id: str, db: Session = Depends(get_db)):
    arch = db.query(Architecture).filter(Architecture.id == architecture_id).first()
    if not arch:
        raise HTTPException(status_code=404, detail="Architecture not found")

    graph = ArchitectureGraph(**json.loads(arch.graph_json))
    model = ModelCompiler.compile(graph)

    model_rec = db.query(ModelRecord).filter(ModelRecord.architecture_id == arch.id).order_by(ModelRecord.created_at.desc()).first()
    if model_rec and model_rec.checkpoint_path and os.path.exists(model_rec.checkpoint_path):
        ckpt = torch.load(model_rec.checkpoint_path, map_location="cpu", weights_only=False)
        model.load_state_dict(ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt)

    distributions = ModelInspectionHooks.extract_weight_distributions(model)
    return {"weight_distributions": distributions}
