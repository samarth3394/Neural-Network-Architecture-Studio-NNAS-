from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Workspace, WorkspaceMember, User
from app.api.deps import get_current_user, record_audit

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


class WorkspaceCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = ""


class WorkspaceResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    owner_id: str
    role: Optional[str] = "member"


class MemberAdd(BaseModel):
    user_email: str
    role: str = "ml_engineer"


@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Return workspaces where user is member or owner
    memberships = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.id).all()
    ws_ids = [m.workspace_id for m in memberships]

    workspaces = db.query(Workspace).filter((Workspace.id.in_(ws_ids)) | (Workspace.owner_id == current_user.id)).all()
    res = []
    role_map = {m.workspace_id: m.role for m in memberships}

    for w in workspaces:
        res.append({
            "id": w.id,
            "name": w.name,
            "slug": w.slug,
            "description": w.description,
            "owner_id": w.owner_id,
            "role": "owner" if w.owner_id == current_user.id else role_map.get(w.id, "viewer"),
        })
    return res


@router.post("", response_model=WorkspaceResponse)
def create_workspace(
    ws_in: WorkspaceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    existing = db.query(Workspace).filter(Workspace.slug == ws_in.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Workspace slug already exists")

    new_ws = Workspace(
        name=ws_in.name,
        slug=ws_in.slug.lower(),
        description=ws_in.description,
        owner_id=current_user.id,
    )
    db.add(new_ws)
    db.commit()
    db.refresh(new_ws)

    db.add(WorkspaceMember(workspace_id=new_ws.id, user_id=current_user.id, role="owner"))
    db.commit()

    record_audit(db, "CREATE_WORKSPACE", "workspace", new_ws.id, current_user.id, new_ws.id)

    return {
        "id": new_ws.id,
        "name": new_ws.name,
        "slug": new_ws.slug,
        "description": new_ws.description,
        "owner_id": new_ws.owner_id,
        "role": "owner",
    }
