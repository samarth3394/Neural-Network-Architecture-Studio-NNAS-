import os
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import DatasetModel, Workspace, User
from app.storage.artifact_store import ArtifactStorage
from app.ml.datasets import DatasetManager
from app.api.deps import get_current_user, record_audit

router = APIRouter(prefix="/datasets", tags=["Datasets"])


class DatasetResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    dataset_type: str
    num_samples: int
    input_shape: List[int]
    num_classes: int
    fingerprint: Optional[str]
    schema_info: Dict[str, Any]
    created_at: str


@router.get("", response_model=List[DatasetResponse])
def list_datasets(
    workspace_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(DatasetModel)
    if workspace_id:
        query = query.filter(DatasetModel.workspace_id == workspace_id)
    datasets = query.all()

    res = []
    for d in datasets:
        schema_dict = json.loads(d.schema_json) if d.schema_json else {}
        res.append({
            "id": d.id,
            "workspace_id": d.workspace_id,
            "name": d.name,
            "dataset_type": d.dataset_type,
            "num_samples": d.num_samples,
            "input_shape": json.loads(d.input_shape_json) if d.input_shape_json else [4],
            "num_classes": d.num_classes,
            "fingerprint": d.fingerprint,
            "schema_info": schema_dict,
            "created_at": d.created_at.isoformat() if d.created_at else "",
        })
    return res


@router.get("/{id}", response_model=DatasetResponse)
def get_dataset(id: str, db: Session = Depends(get_db)):
    d = db.query(DatasetModel).filter(DatasetModel.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dataset not found")

    schema_dict = json.loads(d.schema_json) if d.schema_json else {}
    return {
        "id": d.id,
        "workspace_id": d.workspace_id,
        "name": d.name,
        "dataset_type": d.dataset_type,
        "num_samples": d.num_samples,
        "input_shape": json.loads(d.input_shape_json) if d.input_shape_json else [4],
        "num_classes": d.num_classes,
        "fingerprint": d.fingerprint,
        "schema_info": schema_dict,
        "created_at": d.created_at.isoformat() if d.created_at else "",
    }


@router.post("/upload-csv", response_model=DatasetResponse)
async def upload_csv_dataset(
    workspace_id: str = Form(...),
    name: str = Form(...),
    target_column: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    MAX_FILE_SIZE = 1024 * 1024 * 1024  # 1GB (1024MB) limit
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 1GB (1024MB) limit.")

    checksum = ArtifactStorage.compute_checksum(content)
    file_subpath = f"datasets/{workspace_id}/{checksum}_{file.filename}"
    saved_path = ArtifactStorage.save_file(file_subpath, content)

    try:
        data = DatasetManager.get_dataset(
            dataset_name="custom_csv",
            csv_path=saved_path,
            target_column=target_column,
        )
    except Exception as ex:
        # Clean up corrupted file
        ArtifactStorage.delete_file(saved_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse and validate CSV: {str(ex)}")

    meta = data["metadata"]
    db_ds = DatasetModel(
        workspace_id=workspace_id,
        name=name,
        dataset_type="custom_csv",
        file_path=saved_path,
        fingerprint=checksum,
        num_samples=meta.get("total_samples", 0),
        input_shape_json=json.dumps(meta.get("input_shape", [4])),
        num_classes=meta.get("num_classes", 2),
        schema_json=json.dumps(meta),
    )
    db.add(db_ds)
    db.commit()
    db.refresh(db_ds)

    record_audit(db, "UPLOAD_DATASET", "dataset", db_ds.id, current_user.id, workspace_id)

    return {
        "id": db_ds.id,
        "workspace_id": db_ds.workspace_id,
        "name": db_ds.name,
        "dataset_type": db_ds.dataset_type,
        "num_samples": db_ds.num_samples,
        "input_shape": meta.get("input_shape", [4]),
        "num_classes": db_ds.num_classes,
        "fingerprint": db_ds.fingerprint,
        "schema_info": meta,
        "created_at": db_ds.created_at.isoformat(),
    }


@router.post("/upload-zip", response_model=DatasetResponse)
async def upload_image_zip_dataset(
    workspace_id: str = Form(...),
    name: str = Form(...),
    color_mode: str = Form("grayscale"),
    image_size: int = Form(28),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    MAX_FILE_SIZE = 1024 * 1024 * 1024  # 1GB (1024MB) limit
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 1GB limit.")

    checksum = ArtifactStorage.compute_checksum(content)
    file_subpath = f"datasets/{workspace_id}/{checksum}_{file.filename}"
    saved_path = ArtifactStorage.save_file(file_subpath, content)

    try:
        data = DatasetManager.get_dataset(
            dataset_name="custom_image_zip",
            csv_path=saved_path,
            image_size=image_size,
            color_mode=color_mode,
        )
    except Exception as ex:
        ArtifactStorage.delete_file(saved_path)
        raise HTTPException(status_code=400, detail=f"Failed to process image ZIP dataset: {str(ex)}")

    meta = data["metadata"]
    input_shape = meta.get("input_shape", [1, 28, 28])
    db_ds = DatasetModel(
        workspace_id=workspace_id,
        name=name,
        dataset_type="custom_image_zip",
        file_path=saved_path,
        fingerprint=checksum,
        num_samples=meta.get("total_samples", 0),
        input_shape_json=json.dumps(input_shape),
        num_classes=meta.get("num_classes", 2),
        schema_json=json.dumps(meta),
    )
    db.add(db_ds)
    db.commit()
    db.refresh(db_ds)

    record_audit(db, "UPLOAD_IMAGE_ZIP_DATASET", "dataset", db_ds.id, current_user.id, workspace_id)

    return {
        "id": db_ds.id,
        "workspace_id": db_ds.workspace_id,
        "name": db_ds.name,
        "dataset_type": db_ds.dataset_type,
        "num_samples": db_ds.num_samples,
        "input_shape": input_shape,
        "num_classes": db_ds.num_classes,
        "fingerprint": db_ds.fingerprint,
        "schema_info": meta,
        "created_at": db_ds.created_at.isoformat(),
    }
