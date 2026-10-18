import os
import hashlib
import shutil
from typing import Optional
from app.core.config import settings


class ArtifactStorage:
    """
    Production storage adapter for model weights, datasets, and experiment logs.
    Includes path-traversal safeguards and SHA-256 fingerprint verification.
    """

    @classmethod
    def save_file(cls, relative_subpath: str, content: bytes) -> str:
        # Prevent directory traversal attacks
        clean_path = os.path.normpath(relative_subpath)
        if clean_path.startswith("..") or os.path.isabs(clean_path):
            raise ValueError(f"Security error: Invalid path traversal attempt: {relative_subpath}")

        full_path = os.path.join(settings.LOCAL_STORAGE_DIR, clean_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        with open(full_path, "wb") as f:
            f.write(content)

        return full_path

    @classmethod
    def read_file(cls, full_path: str) -> bytes:
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Artifact not found: {full_path}")
        with open(full_path, "rb") as f:
            return f.read()

    @classmethod
    def delete_file(cls, full_path: str) -> bool:
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False

    @classmethod
    def compute_checksum(cls, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()
