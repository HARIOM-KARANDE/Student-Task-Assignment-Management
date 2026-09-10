from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.security import get_current_active_user, get_current_admin
from backend.app.models.user import User
from backend.app.models.subject import Subject
from backend.app.models.class_model import Class
from backend.app.schemas.subject import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse
)

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Subject)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Subject.name.ilike(s)) | (Subject.code.ilike(s)))

    subjects = query.order_by(Subject.name.asc()).all()

    # Enrich with classes_count
    result = []
    for sub in subjects:
        c_count = db.query(func.count(Class.id)).filter(Class.subject_id == sub.id).scalar() or 0
        resp = SubjectResponse.model_validate(sub)
        resp.classes_count = c_count
        result.append(resp)
    return result

@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_in: SubjectCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    code_clean = subject_in.code.strip().upper()
    existing = db.query(Subject).filter(Subject.code == code_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject with code '{code_clean}' already exists"
        )

    subject = Subject(
        name=subject_in.name.strip(),
        code=code_clean,
        description=subject_in.description.strip() if subject_in.description else None,
        created_by_id=admin_user.id
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)

    resp = SubjectResponse.model_validate(subject)
    resp.classes_count = 0
    return resp

@router.get("/{id}", response_model=SubjectResponse)
def get_subject_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    c_count = db.query(func.count(Class.id)).filter(Class.subject_id == subject.id).scalar() or 0
    resp = SubjectResponse.model_validate(subject)
    resp.classes_count = c_count
    return resp

@router.put("/{id}", response_model=SubjectResponse)
def update_subject(
    id: int,
    subject_in: SubjectUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    if subject_in.code is not None:
        code_clean = subject_in.code.strip().upper()
        if code_clean != subject.code:
            existing = db.query(Subject).filter(Subject.code == code_clean, Subject.id != id).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Subject with code '{code_clean}' already exists"
                )
            subject.code = code_clean

    if subject_in.name is not None:
        subject.name = subject_in.name.strip()
    if subject_in.description is not None:
        subject.description = subject_in.description.strip()

    db.commit()
    db.refresh(subject)

    c_count = db.query(func.count(Class.id)).filter(Class.subject_id == subject.id).scalar() or 0
    resp = SubjectResponse.model_validate(subject)
    resp.classes_count = c_count
    return resp

@router.delete("/{id}")
def delete_subject(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    db.delete(subject)
    db.commit()
    return {"message": "Subject and related classes deleted successfully"}
