import os
import shutil
import torch
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.db.models import TrainingJob
from app.core.config import settings
from app.workers.queue import job_manager

router = APIRouter(prefix="/monitoring", tags=["Operations & Monitoring"])


@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    # Check DB
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Check Worker Queue
    running_count = db.query(TrainingJob).filter(TrainingJob.status == "RUNNING").count()
    queued_count = db.query(TrainingJob).filter(TrainingJob.status == "QUEUED").count()

    # Disk Storage
    storage_path = settings.LOCAL_STORAGE_DIR
    try:
        disk_usage = shutil.disk_usage(storage_path)
        disk_info = {
            "total_gb": round(disk_usage.total / (1024**3), 2),
            "free_gb": round(disk_usage.free / (1024**3), 2),
            "used_gb": round(disk_usage.used / (1024**3), 2),
        }
    except Exception:
        disk_info = {"status": "unavailable"}

    # PyTorch compute environment
    cuda_available = torch.cuda.is_available()
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU (Host Runtime)"

    return {
        "status": "operational",
        "database": db_status,
        "workers": {
            "active_running_jobs": running_count,
            "queued_jobs": queued_count,
            "max_concurrency": settings.MAX_CONCURRENT_TRAINING_JOBS,
        },
        "compute": {
            "pytorch_version": torch.__version__,
            "device": device_name,
            "cuda_available": cuda_available,
        },
        "storage": disk_info,
    }
