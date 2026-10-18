import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="ml_engineer")  # admin, ml_engineer, researcher, viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="ml_engineer")  # owner, admin, ml_engineer, researcher, viewer
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Architecture(Base):
    __tablename__ = "architectures"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    version = Column(String(50), default="1.0.0")
    description = Column(Text, nullable=True)
    task = Column(String(50), default="classification")
    input_shape_json = Column(Text, default="[1, 28, 28]")
    num_classes = Column(Integer, default=10)
    graph_json = Column(Text, nullable=False)
    total_params = Column(Integer, default=0)
    trainable_params = Column(Integer, default=0)
    is_valid = Column(Boolean, default=True)
    validation_errors_json = Column(Text, default="[]")
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String(255), nullable=False)
    dataset_type = Column(String(50), default="synthetic")  # mnist, synthetic, tabular_csv
    file_path = Column(String(500), nullable=True)
    fingerprint = Column(String(64), nullable=True)
    num_samples = Column(Integer, default=0)
    input_shape_json = Column(Text, default="[4]")
    num_classes = Column(Integer, default=2)
    schema_json = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), default=utc_now)


class TrainingJob(Base):
    __tablename__ = "training_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    architecture_id = Column(String(36), ForeignKey("architectures.id"), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    status = Column(String(50), default="QUEUED")  # QUEUED, STARTING, RUNNING, PAUSING, PAUSED, CANCELLING, CANCELLED, SUCCEEDED, FAILED
    config_json = Column(Text, default="{}")
    metrics_json = Column(Text, default="[]")
    current_epoch = Column(Integer, default=0)
    total_epochs = Column(Integer, default=10)
    best_val_loss = Column(Float, nullable=True)
    best_epoch = Column(Integer, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    checkpoint_path = Column(String(500), nullable=True)
    logs_json = Column(Text, default="[]")
    evaluation_json = Column(Text, default="{}")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    name = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    tags_json = Column(Text, default="[]")
    training_job_id = Column(String(36), ForeignKey("training_jobs.id"), nullable=False)
    architecture_id = Column(String(36), ForeignKey("architectures.id"), nullable=False)
    metrics_summary_json = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), default=utc_now)


class OptimizationJob(Base):
    __tablename__ = "optimization_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    base_architecture_id = Column(String(36), ForeignKey("architectures.id"), nullable=False)
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=False)
    status = Column(String(50), default="QUEUED")
    config_json = Column(Text, default="{}")
    best_candidate_json = Column(Text, default="{}")
    pareto_frontier_json = Column(Text, default="[]")
    all_trials_json = Column(Text, default="[]")
    duration_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ModelRecord(Base):
    __tablename__ = "model_registry"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    architecture_id = Column(String(36), ForeignKey("architectures.id"), nullable=False)
    training_job_id = Column(String(36), ForeignKey("training_jobs.id"), nullable=True)
    name = Column(String(255), nullable=False)
    version = Column(String(50), default="1.0.0")
    stage = Column(String(50), default="draft")  # draft, trained, evaluated, approved, deployed, archived
    metrics_json = Column(Text, default="{}")
    checkpoint_path = Column(String(500), nullable=True)
    approval_notes = Column(Text, nullable=True)
    approved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_id = Column(String(36), ForeignKey("model_registry.id"), nullable=False)
    name = Column(String(255), nullable=False)
    endpoint_path = Column(String(255), unique=True, index=True, nullable=False)
    status = Column(String(50), default="active")  # active, inactive, rolled_back
    latency_p50 = Column(Float, default=0.0)
    latency_p95 = Column(Float, default=0.0)
    request_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), nullable=True)
    user_id = Column(String(36), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime(timezone=True), default=utc_now)
