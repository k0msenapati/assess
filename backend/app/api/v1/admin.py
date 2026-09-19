from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.api.deps import get_db, require_admin
from app.models.user import User, UserRole
from app.repositories.user import user_repo
from app.repositories.system_config import system_config_repo
from app.schemas.admin import AdminUserOut, UserRoleUpdate, SystemConfigUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[AdminUserOut])
def list_users(current_user: User = Depends(require_admin), session: Session = Depends(get_db)):
    users = user_repo.list(session)
    return [
        AdminUserOut(
            id=u.id,  # type: ignore
            username=u.username,
            email=u.email,
            role=u.role,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.put("/users/{user_id}/role", response_model=AdminUserOut)
def update_user_role(
    user_id: int,
    data: UserRoleUpdate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_db),
):
    valid_roles = [UserRole.STUDENT, UserRole.PROFESSOR, UserRole.ADMIN]
    if data.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{data.role}'. Allowed roles: {valid_roles}",
        )

    user = user_repo.get(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = data.role
    updated = user_repo.update(session, user)
    return AdminUserOut(
        id=updated.id,  # type: ignore
        username=updated.username,
        email=updated.email,
        role=updated.role,
        created_at=updated.created_at,
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_db),
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    user = user_repo.get(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user_repo.delete(session, user_id)
    return None


@router.get("/config", response_model=Dict[str, str])
def get_system_config(
    current_user: User = Depends(require_admin), session: Session = Depends(get_db)
):
    return system_config_repo.get_all_as_dict(session)


@router.put("/config", response_model=Dict[str, str])
def update_system_config(
    data: SystemConfigUpdate,
    current_user: User = Depends(require_admin),
    session: Session = Depends(get_db),
):
    for k, v in data.configs.items():
        system_config_repo.set_value(session, key=k, value=v)
    return system_config_repo.get_all_as_dict(session)
