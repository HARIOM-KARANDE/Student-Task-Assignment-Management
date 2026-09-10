from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.core.database import engine, Base
import backend.app.models  # Ensure all models are registered

from backend.app.api.auth import router as auth_router
from backend.app.api.subjects import router as subjects_router
from backend.app.api.classes import router as classes_router
from backend.app.api.assignments import router as assignments_router
from backend.app.api.submissions import router as submissions_router
from backend.app.api.students import router as students_router
from backend.app.api.notifications import router as notifications_router
from backend.app.api.stats import router as stats_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    # Ensure upload dirs exist
    _ = settings.uploads_path
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend API for Student Task & Assignment Management System",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & local IP access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads
uploads_dir = settings.uploads_path
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(subjects_router, prefix="/api")
app.include_router(classes_router, prefix="/api")
app.include_router(assignments_router, prefix="/api")
app.include_router(submissions_router, prefix="/api")
app.include_router(students_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(stats_router, prefix="/api")

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "api": "/api"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
