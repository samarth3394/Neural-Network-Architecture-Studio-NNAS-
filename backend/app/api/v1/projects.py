from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Project, Workspace, User
from app.api.deps import get_current_user, record_audit

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectCreate(BaseModel):
    workspace_id: str
    name: str
    description: Optional[str] = ""


class ProjectResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str]
    created_at: str


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    workspace_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project)
    if workspace_id:
        query = query.filter(Project.workspace_id == workspace_id)
    projects = query.all()
    return [
        {
            "id": p.id,
            "workspace_id": p.workspace_id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at.isoformat() if p.created_at else "",
        }
        for p in projects
    ]


@router.post("", response_model=ProjectResponse)
def create_project(
    proj_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws = db.query(Workspace).filter(Workspace.id == proj_in.workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    new_p = Project(
        workspace_id=proj_in.workspace_id,
        name=proj_in.name,
        description=proj_in.description,
        created_by=current_user.id,
    )
    db.add(new_p)
    db.commit()
    db.refresh(new_p)

    record_audit(db, "CREATE_PROJECT", "project", new_p.id, current_user.id, ws.id)

    return {
        "id": new_p.id,
        "workspace_id": new_p.workspace_id,
        "name": new_p.name,
        "description": new_p.description,
        "created_at": new_p.created_at.isoformat(),
    }
