from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.security import get_current_admin
from backend.app.models.user import User
from backend.app.models.class_model import Class
from backend.app.models.class_student import ClassStudent
from backend.app.models.assignment import Assignment
from backend.app.models.submission import Submission
from backend.app.schemas.user import UserResponse, UserUpdate
from backend.app.schemas.class_schema import ClassResponse
from backend.app.schemas.submission import SubmissionResponse

router = APIRouter(prefix="/students", tags=["Student Management (Admin)"])

@router.get("", response_model=List[UserResponse])
def get_all_students(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    query = db.query(User).filter(User.role == "student")

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((User.full_name.ilike(s)) | (User.email.ilike(s)) | (User.phone.ilike(s)))

    students = query.order_by(User.created_at.desc()).all()
    return [UserResponse.model_validate(s) for s in students]

@router.get("/{id}")
def get_student_detail(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    student = db.query(User).filter(User.id == id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    # Enrolled classes
    enrollments = db.query(ClassStudent).filter(ClassStudent.student_id == student.id).all()
    classes_list = []
    for en in enrollments:
        if en.class_:
            c_resp = ClassResponse.model_validate(en.class_)
            if en.class_.subject:
                c_resp.subject_name = en.class_.subject.name
                c_resp.subject_code = en.class_.subject.code
            classes_list.append(c_resp)

    # Submissions history
    submissions = db.query(Submission).filter(
        Submission.student_id == student.id
    ).order_by(Submission.submitted_at.desc()).all()

    sub_list = []
    for sub in submissions:
        s_resp = SubmissionResponse.model_validate(sub)
        if sub.assignment:
            s_resp.assignment_title = sub.assignment.title
            s_resp.total_marks = sub.assignment.total_marks
            s_resp.due_date = sub.assignment.due_date
            if sub.assignment.class_:
                s_resp.class_name = sub.assignment.class_.name
        sub_list.append(s_resp)

    return {
        "student": UserResponse.model_validate(student),
        "classes": classes_list,
        "submissions": sub_list,
        "stats": {
            "enrolled_classes": len(classes_list),
            "total_submissions": len(sub_list),
            "completed_submissions": len([s for s in sub_list if s.status == "Completed"]),
            "late_submissions": len([s for s in sub_list if s.status == "Late"])
        }
    }

@router.put("/{id}", response_model=UserResponse)
def update_student(
    id: int,
    student_in: UserUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    student = db.query(User).filter(User.id == id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if student_in.full_name is not None:
        student.full_name = student_in.full_name.strip()
    if student_in.phone is not None:
        student.phone = student_in.phone.strip()
    if student_in.bio is not None:
        student.bio = student_in.bio.strip()

    db.commit()
    db.refresh(student)
    return UserResponse.model_validate(student)

@router.patch("/{id}/status", response_model=UserResponse)
def toggle_student_status(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    student = db.query(User).filter(User.id == id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    student.is_active = not student.is_active
    db.commit()
    db.refresh(student)
    return UserResponse.model_validate(student)

@router.delete("/{id}")
def delete_student(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    student = db.query(User).filter(User.id == id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    db.delete(student)
    db.commit()
    return {"message": "Student account deleted successfully"}
