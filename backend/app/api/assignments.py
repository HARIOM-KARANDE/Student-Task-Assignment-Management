import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import get_current_active_user, get_current_admin
from backend.app.models.user import User
from backend.app.models.class_model import Class
from backend.app.models.class_student import ClassStudent
from backend.app.models.assignment import Assignment
from backend.app.models.submission import Submission
from backend.app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse
)
from backend.app.services.notification_service import notify_new_assignment, notify_assignment_updated

router = APIRouter(prefix="/assignments", tags=["Assignments"])

def enrich_assignment_response(
    assignment: Assignment,
    db: Session,
    current_user: User
) -> AssignmentResponse:
    resp = AssignmentResponse.model_validate(assignment)
    if assignment.class_:
        resp.class_name = assignment.class_.name
        if assignment.class_.subject:
            resp.subject_name = assignment.class_.subject.name
            resp.subject_code = assignment.class_.subject.code

    resp.submissions_count = db.query(func.count(Submission.id)).filter(
        Submission.assignment_id == assignment.id
    ).scalar() or 0

    if current_user.role == "student":
        sub = db.query(Submission).filter(
            Submission.assignment_id == assignment.id,
            Submission.student_id == current_user.id
        ).first()
        if sub:
            resp.my_submission = {
                "id": sub.id,
                "status": sub.status,
                "solution_file_url": sub.solution_file_url,
                "submission_text": sub.submission_text,
                "marks_awarded": sub.marks_awarded,
                "feedback": sub.feedback,
                "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
                "graded_at": sub.graded_at.isoformat() if sub.graded_at else None
            }
        else:
            # Not submitted yet. Is it past due?
            now = datetime.now(timezone.utc)
            # Make sure due_date has timezone
            due = assignment.due_date
            if due.tzinfo is None:
                due = due.replace(tzinfo=timezone.utc)
            is_overdue = now > due
            resp.my_submission = {
                "id": None,
                "status": "Late" if is_overdue else "Pending",
                "solution_file_url": None,
                "submission_text": None,
                "marks_awarded": None,
                "feedback": None,
                "submitted_at": None,
                "graded_at": None
            }
    return resp

@router.get("", response_model=List[AssignmentResponse])
def get_assignments(
    class_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),  # Pending, Submitted, Completed, Late
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Assignment)

    if current_user.role == "student":
        # Only from enrolled classes
        joined_class_ids = db.query(ClassStudent.class_id).filter(
            ClassStudent.student_id == current_user.id
        ).subquery()
        query = query.filter(Assignment.class_id.in_(joined_class_ids))

    if class_id:
        query = query.filter(Assignment.class_id == class_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(Assignment.title.ilike(s) | Assignment.description.ilike(s))

    assignments = query.order_by(Assignment.due_date.asc()).all()

    result = []
    for a in assignments:
        resp = enrich_assignment_response(a, db, current_user)
        # Apply status filter if requested for students
        if status_filter and current_user.role == "student":
            curr_status = resp.my_submission.get("status") if resp.my_submission else "Pending"
            if curr_status.lower() != status_filter.lower():
                continue
        result.append(resp)

    return result

@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    class_obj = db.query(Class).filter(Class.id == assignment_in.class_id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    assignment = Assignment(
        class_id=assignment_in.class_id,
        title=assignment_in.title.strip(),
        description=assignment_in.description.strip() if assignment_in.description else None,
        question_text=assignment_in.question_text.strip() if assignment_in.question_text else None,
        total_marks=assignment_in.total_marks or 100,
        due_date=assignment_in.due_date,
        created_by_id=admin_user.id
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # Notify enrolled students
    notify_new_assignment(db, assignment, class_obj)

    return enrich_assignment_response(assignment, db, admin_user)

@router.get("/{id}", response_model=AssignmentResponse)
def get_assignment_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if current_user.role == "student":
        enrolled = db.query(ClassStudent).filter(
            ClassStudent.class_id == assignment.class_id,
            ClassStudent.student_id == current_user.id
        ).first()
        if not enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to assignments in this class"
            )

    return enrich_assignment_response(assignment, db, current_user)

@router.put("/{id}", response_model=AssignmentResponse)
def update_assignment(
    id: int,
    assignment_in: AssignmentUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if assignment_in.title is not None:
        assignment.title = assignment_in.title.strip()
    if assignment_in.description is not None:
        assignment.description = assignment_in.description.strip()
    if assignment_in.question_text is not None:
        assignment.question_text = assignment_in.question_text.strip()
    if assignment_in.total_marks is not None:
        assignment.total_marks = assignment_in.total_marks
    if assignment_in.due_date is not None:
        assignment.due_date = assignment_in.due_date

    db.commit()
    db.refresh(assignment)

    if assignment.class_:
        notify_assignment_updated(db, assignment, assignment.class_)

    return enrich_assignment_response(assignment, db, admin_user)

@router.delete("/{id}")
def delete_assignment(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted successfully"}

@router.post("/{id}/upload-question", response_model=AssignmentResponse)
def upload_question_pdf(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    ext = Path(file.filename or "question.pdf").suffix.lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are accepted for question files"
        )

    questions_dir = settings.uploads_path / "questions"
    filename = f"question_asg_{assignment.id}_{uuid.uuid4().hex[:8]}.pdf"
    dest_path = questions_dir / filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    assignment.question_file_url = f"/uploads/questions/{filename}"
    db.commit()
    db.refresh(assignment)

    if assignment.class_:
        notify_assignment_updated(db, assignment, assignment.class_)

    return enrich_assignment_response(assignment, db, admin_user)
