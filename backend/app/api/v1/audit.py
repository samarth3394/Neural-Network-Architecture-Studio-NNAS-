import json
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import AuditLog, User
from app.api.deps import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


class AuditLogResponse(BaseModel):
    id: str
    workspace_id: Optional[str]
    user_id: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: dict
    created_at: str


@router.get("", response_model=List[AuditLogResponse])
def list_audit_logs(
    workspace_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(AuditLog)
    if workspace_id:
        query = query.filter(AuditLog.workspace_id == workspace_id)
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    return [
        {
            "id": l.id,
            "workspace_id": l.workspace_id,
            "user_id": l.user_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": json.loads(l.details_json) if l.details_json else {},
            "created_at": l.created_at.isoformat() if l.created_at else "",
        }
        for l in logs
    ]
