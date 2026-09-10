import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Student Task & Assignment Management System"
    DATABASE_URL: str = "postgresql://postgres:internhub@localhost:5432/student_assignment_db"
    SECRET_KEY: str = "student_assignment_super_secret_jwt_key_2026_xyz_auth_token"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 25
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @property
    def uploads_path(self) -> Path:
        p = BASE_DIR / self.UPLOAD_DIR
        p.mkdir(parents=True, exist_ok=True)
        (p / "avatars").mkdir(parents=True, exist_ok=True)
        (p / "questions").mkdir(parents=True, exist_ok=True)
        (p / "submissions").mkdir(parents=True, exist_ok=True)
        return p

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
