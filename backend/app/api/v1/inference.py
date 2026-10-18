import json
import os
import torch
import numpy as np
from typing import List, Dict, Any, Optional, Union
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Deployment, ModelRecord, Architecture, TrainingJob
from app.ml.schema import ArchitectureGraph
from app.ml.compiler import ModelCompiler
from app.ml.inference_engine import DeploymentInferenceEngine
from app.ml.explainability import ModelExplainability

router = APIRouter(prefix="/inference", tags=["Inference"])


class PredictRequest(BaseModel):
    input_data: Union[List[float], List[List[float]], List[List[List[float]]], List[List[List[List[float]]]]]


class MNISTCanvasRequest(BaseModel):
    pixels: List[List[float]]  # 28x28 normalized values 0.0 - 1.0
    model_id: Optional[str] = None


@router.post("/deployments/{deployment_id}/predict")
def predict_deployment(deployment_id: str, req: PredictRequest, db: Session = Depends(get_db)):
    dep = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not dep or dep.status != "active":
        raise HTTPException(status_code=404, detail="Active deployment not found")

    model_rec = db.query(ModelRecord).filter(ModelRecord.id == dep.model_id).first()
    arch = db.query(Architecture).filter(Architecture.id == model_rec.architecture_id).first()
    graph = ArchitectureGraph(**json.loads(arch.graph_json))

    engine = DeploymentInferenceEngine(
        checkpoint_path=model_rec.checkpoint_path,
        architecture_graph=graph,
    )
    engine.load_and_warmup(warmup_runs=1)

    try:
        res = engine.predict(req.input_data)
        dep.request_count = (dep.request_count or 0) + 1
        db.commit()
        return res
    except Exception as ex:
        raise HTTPException(status_code=400, detail=f"Inference error: {str(ex)}")


@router.post("/mnist-canvas")
def infer_mnist_digit_drawing(req: MNISTCanvasRequest, db: Session = Depends(get_db)):
    """
    Real-time interactive inference for drawn MNIST digits:
    Runs forward pass through trained model and computes gradient saliency map.
    """
    # Find active or best MNIST model
    model_rec = None
    if req.model_id:
        model_rec = db.query(ModelRecord).filter(ModelRecord.id == req.model_id).first()

    if not model_rec:
        # Fallback to any trained MNIST model
        model_rec = (
            db.query(ModelRecord)
            .join(Architecture, ModelRecord.architecture_id == Architecture.id)
            .filter(Architecture.input_shape_json.like("%28%"))
            .order_by(ModelRecord.created_at.desc())
            .first()
        )

    # Convert 28x28 pixel grid to tensor
    grid = np.array(req.pixels, dtype=np.float32)
    if grid.shape != (28, 28):
        raise HTTPException(status_code=400, detail=f"Expected 28x28 grid, received {grid.shape}")

    tensor = torch.tensor(grid, dtype=torch.float32).unsqueeze(0).unsqueeze(0)  # Shape (1, 1, 28, 28)

    if model_rec and model_rec.checkpoint_path and os.path.exists(model_rec.checkpoint_path):
        arch = db.query(Architecture).filter(Architecture.id == model_rec.architecture_id).first()
        graph = ArchitectureGraph(**json.loads(arch.graph_json))
        model = ModelCompiler.compile(graph)
        ckpt = torch.load(model_rec.checkpoint_path, map_location="cpu", weights_only=False)
        model.load_state_dict(ckpt["model_state_dict"] if "model_state_dict" in ckpt else ckpt)
    else:
        # Use initial seed architecture with deterministic sample weights if no training run yet
        arch = db.query(Architecture).filter(Architecture.name.like("%MNIST%")).first()
        if not arch:
            raise HTTPException(status_code=404, detail="No MNIST architecture found")
        graph = ArchitectureGraph(**json.loads(arch.graph_json))
        model = ModelCompiler.compile(graph)

    saliency = ModelExplainability.compute_image_saliency(model, tensor)
    return {
        "model_used": model_rec.name if model_rec else arch.name,
        "predicted_digit": saliency["predicted_class"],
        "confidence": saliency["confidence"],
        "probabilities": saliency["all_probabilities"],
        "saliency_heatmap": saliency["saliency_map"],
        "attribution_method": saliency["attribution_method"],
    }
