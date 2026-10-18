import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Neural Network Architecture Studio (NNAS)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nnas-production-super-secret-key-change-in-env-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"

    # Database: SQLite fallback for standalone local setup; PostgreSQL for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nnas_studio.db")

    # Redis URL (optional in standalone mode, uses in-process worker queue)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Storage
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # "local" or "s3"
    LOCAL_STORAGE_DIR: str = os.getenv("LOCAL_STORAGE_DIR", os.path.join(os.path.expanduser("~"), ".nnas", "storage"))
    S3_BUCKET: str = os.getenv("S3_BUCKET", "nnas-artifacts")
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "")
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "")

    # Security & Quotas
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_CONCURRENT_TRAINING_JOBS: int = 4
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "*"]


settings = Settings()
os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
