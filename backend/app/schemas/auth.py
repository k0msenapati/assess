from pydantic import BaseModel


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    role: str = "student"


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    user_id: int


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
