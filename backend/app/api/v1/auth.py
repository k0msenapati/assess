from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import UserRegister, TokenResponse, UserOut
from app.services.user_service import (
    register_user,
    authenticate_user,
    generate_user_token,
)
from app.repositories.user import user_repo

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, session: Session = Depends(get_db)):
    if user_repo.get_by_username(session, data.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    if user_repo.get_by_email(session, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = register_user(session, data.username, data.email, data.password, data.role)
    token = generate_user_token(user)
    return TokenResponse(
        access_token=token,
        role=user.role,
        username=user.username,
        user_id=user.id,  # type: ignore
    )


@router.post("/token", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_db)):
    user = authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = generate_user_token(user)
    return TokenResponse(
        access_token=token,
        role=user.role,
        username=user.username,
        user_id=user.id,  # type: ignore
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id,  # type: ignore
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
    )
