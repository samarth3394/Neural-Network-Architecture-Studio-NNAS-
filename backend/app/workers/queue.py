import threading
import time
import json
import os
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
from app.db.session import SessionLocal
from app.db.models import TrainingJob, Architecture, DatasetModel, Experiment, ModelRecord
from app.ml.schema import ArchitectureGraph
from app.ml.compiler import ModelCompiler
from app.ml.datasets import DatasetManager
from app.ml.trainer import TrainingJobExecutor
from app.core.config import settings
from app.core.logging import logger


class JobQueueManager:
    """
    Production-grade background worker and job coordinator:
    - ThreadPool execution of training jobs
    - Controlled cancellation and pause signals
    - Job state persistence and recovery of stale/interrupted jobs
    - Live metrics streaming buffer
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._init_manager()
            return cls._instance

    def _init_manager(self):
        self.executor = ThreadPoolExecutor(max_workers=settings.MAX_CONCURRENT_TRAINING_JOBS)
        self.cancel_flags: Dict[str, threading.Event] = {}
        self.pause_flags: Dict[str, threading.Event] = {}
        self.active_jobs: Dict[str, Dict[str, Any]] = {}
        self._recover_stale_jobs()

    def _recover_stale_jobs(self):
        """
        On server startup, find any jobs previously left in RUNNING or STARTING state
        due to sudden server crash/restart and mark them appropriately.
        """
        db = SessionLocal()
        try:
            stale_jobs = db.query(TrainingJob).filter(TrainingJob.status.in_(["RUNNING", "STARTING"])).all()
            for job in stale_jobs:
                job.status = "FAILED"
                job.error_message = "Worker process interrupted by server restart. Recoverable checkpoint may exist."
                db.add(job)
            db.commit()
            if stale_jobs:
                logger.info(f"Recovered {len(stale_jobs)} stale interrupted jobs.")
        except Exception as e:
            logger.error(f"Error recovering stale jobs: {e}")
        finally:
            db.close()

    def submit_training_job(self, job_id: str) -> None:
        self.cancel_flags[job_id] = threading.Event()
        self.pause_flags[job_id] = threading.Event()
        self.executor.submit(self._run_job_wrapper, job_id)

    def cancel_job(self, job_id: str) -> bool:
        if job_id in self.cancel_flags:
            self.cancel_flags[job_id].set()
            return True
        # If in DB as queued
        db = SessionLocal()
        try:
            job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
            if job and job.status in ("QUEUED", "STARTING"):
                job.status = "CANCELLED"
                db.commit()
                return True
        finally:
            db.close()
        return False

    def pause_job(self, job_id: str) -> bool:
        if job_id in self.pause_flags:
            self.pause_flags[job_id].set()
            self._update_db_status(job_id, "PAUSED")
            return True
        return False

    def resume_job(self, job_id: str) -> bool:
        if job_id in self.pause_flags:
            self.pause_flags[job_id].clear()
            self._update_db_status(job_id, "RUNNING")
            return True
        return False

    def _update_db_status(self, job_id: str, status: str):
        db = SessionLocal()
        try:
            job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
            if job:
                job.status = status
                db.commit()
        finally:
            db.close()

    def _run_job_wrapper(self, job_id: str):
        db = SessionLocal()
        try:
            job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
            if not job:
                logger.error(f"Job {job_id} not found in database.")
                return

            arch_db = db.query(Architecture).filter(Architecture.id == job.architecture_id).first()
            dataset_db = db.query(DatasetModel).filter(DatasetModel.id == job.dataset_id).first()

            if not arch_db or not dataset_db:
                job.status = "FAILED"
                job.error_message = "Referenced Architecture or Dataset was deleted."
                db.commit()
                return

            job.status = "RUNNING"
            db.commit()

            # Prepare Architecture Graph
            graph_dict = json.loads(arch_db.graph_json)
            graph = ArchitectureGraph(**graph_dict)
            model = ModelCompiler.compile(graph)

            # Training Config
            config = json.loads(job.config_json) if job.config_json else {}
            batch_size = int(config.get("batch_size", 32))
            epochs = int(config.get("epochs", 10))
            job.total_epochs = epochs
            db.commit()

            # Prepare Dataset
            data = DatasetManager.get_dataset(
                dataset_name=dataset_db.dataset_type,
                batch_size=batch_size,
                random_seed=int(config.get("random_seed", 42)),
                csv_path=dataset_db.file_path,
            )

            is_classification = dataset_db.num_classes > 1 and graph.task == "classification"
            class_names = data["metadata"].get("classes", [])

            ckpt_dir = os.path.join(settings.LOCAL_STORAGE_DIR, "checkpoints", job.id)

            def on_progress(info: Dict[str, Any]):
                # Buffer live updates to in-memory active jobs map
                self.active_jobs[job_id] = info
                # Periodically sync to DB every epoch
                try:
                    sync_db = SessionLocal()
                    j = sync_db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
                    if j:
                        j.current_epoch = info["current_epoch"]
                        j.metrics_json = json.dumps(info["metrics_history"])
                        logs = json.loads(j.logs_json) if j.logs_json else []
                        logs.append(info["log_line"])
                        j.logs_json = json.dumps(logs)
                        sync_db.commit()
                    sync_db.close()
                except Exception as ex:
                    logger.warning(f"Failed to sync epoch metrics: {ex}")

            def is_cancelled() -> bool:
                flag = self.cancel_flags.get(job_id)
                return flag.is_set() if flag else False

            def is_paused() -> bool:
                flag = self.pause_flags.get(job_id)
                return flag.is_set() if flag else False

            # Run actual training
            res = TrainingJobExecutor.train(
                model=model,
                train_loader=data["train_loader"],
                val_loader=data["val_loader"],
                test_loader=data["test_loader"],
                training_config=config,
                checkpoint_dir=ckpt_dir,
                is_classification=is_classification,
                class_names=class_names,
                progress_callback=on_progress,
                cancellation_check=is_cancelled,
                pause_check=is_paused,
            )

            # Persist final results
            job.status = res["status"]
            job.duration_seconds = res["total_duration_seconds"]
            job.best_epoch = res["best_epoch"]
            job.best_val_loss = res["best_val_loss"]
            job.metrics_json = json.dumps(res["metrics_history"])
            job.logs_json = json.dumps(res["logs"])
            job.evaluation_json = json.dumps(res["evaluation"])
            job.checkpoint_path = res["checkpoint_path"]
            db.commit()

            if res["status"] == "SUCCEEDED":
                # Create persistent Experiment record
                exp = Experiment(
                    project_id=job.project_id,
                    name=f"Run - {arch_db.name} on {dataset_db.name}",
                    training_job_id=job.id,
                    architecture_id=arch_db.id,
                    metrics_summary_json=json.dumps({
                        "best_epoch": res["best_epoch"],
                        "best_val_loss": res["best_val_loss"],
                        "evaluation": res["evaluation"],
                    }),
                )
                db.add(exp)

                # Create initial ModelRecord in Model Registry (stage="evaluated")
                model_rec = ModelRecord(
                    project_id=job.project_id,
                    architecture_id=arch_db.id,
                    training_job_id=job.id,
                    name=f"{arch_db.name}-model",
                    version=f"{arch_db.version}.1",
                    stage="evaluated",
                    metrics_json=json.dumps(res["evaluation"]),
                    checkpoint_path=res["checkpoint_path"],
                )
                db.add(model_rec)
                db.commit()

        except Exception as e:
            logger.error(f"Training worker error on job {job_id}: {str(e)}", exc_info=True)
            try:
                job.status = "FAILED"
                job.error_message = str(e)
                db.commit()
            except Exception:
                pass
        finally:
            self.cancel_flags.pop(job_id, None)
            self.pause_flags.pop(job_id, None)
            self.active_jobs.pop(job_id, None)
            db.close()


job_manager = JobQueueManager()
