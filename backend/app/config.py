import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Assess"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "assess-academic-integrity-secret-key-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = "sqlite:///./assess.db"
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "qwen-2.5-32b"
    GROQ_BACKUP_MODEL: str = "llama-3.3-70b-versatile"
    UPLOAD_DIR: str = "./uploads"


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
