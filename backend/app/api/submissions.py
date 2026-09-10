import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import (
    get_current_active_user,
    get_current_admin,
    get_current_student
)
from backend.app.models.user import User
from backend.app.models.class_student import ClassStudent
from backend.app.models.assignment import Assignment
from backend.app.models.submission import Submission
from backend.app.schemas.submission import (
    SubmissionCreate,
    SubmissionGrade,
    SubmissionResponse
)
from backend.app.services.notification_service import (
    notify_submission_received,
    notify_submission_graded
)

router = APIRouter(prefix="/submissions", tags=["Submissions"])

def enrich_submission(sub: Submission) -> SubmissionResponse:
    resp = SubmissionResponse.model_validate(sub)
    if sub.student:
        resp.student_name = sub.student.full_name
        resp.student_email = sub.student.email
    if sub.assignment:
        resp.assignment_title = sub.assignment.title
        resp.total_marks = sub.assignment.total_marks
        resp.due_date = sub.assignment.due_date
        if sub.assignment.class_:
            resp.class_name = sub.assignment.class_.name
            if sub.assignment.class_.subject:
                resp.subject_name = sub.assignment.class_.subject.name
    return resp

@router.post("/{assignment_id}/submit", response_model=SubmissionResponse)
def submit_assignment(
    assignment_id: int,
    submission_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    # Check student is enrolled in class
    enrolled = db.query(ClassStudent).filter(
        ClassStudent.class_id == assignment.class_id,
        ClassStudent.student_id == student.id
    ).first()
    if not enrolled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in the class for this assignment"
        )

    # Detect Late or Submitted
    now = datetime.now(timezone.utc)
    due = assignment.due_date
    if due.tzinfo is None:
        due = due.replace(tzinfo=timezone.utc)

    is_late = now > due
    sub_status = "Late" if is_late else "Submitted"

    solution_url = None
    if file and file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext != ".pdf":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are permitted for solution uploads"
            )

        submissions_dir = settings.uploads_path / "submissions"
        filename = f"sol_{assignment_id}_{student.id}_{uuid.uuid4().hex[:8]}.pdf"
        dest_path = submissions_dir / filename

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        solution_url = f"/uploads/submissions/{filename}"

    # Check if submission already exists
    existing = db.query(Submission).filter(
        Submission.assignment_id == assignment_id,
        Submission.student_id == student.id
    ).first()

    if existing:
        existing.submitted_at = now
        existing.status = sub_status
        if submission_text is not None:
            existing.submission_text = submission_text.strip()
        if solution_url:
            existing.solution_file_url = solution_url
        db.commit()
        db.refresh(existing)
        sub = existing
    else:
        sub = Submission(
            assignment_id=assignment_id,
            student_id=student.id,
            solution_file_url=solution_url,
            submission_text=submission_text.strip() if submission_text else None,
            status=sub_status,
            submitted_at=now
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

    # Notify admin
    notify_submission_received(db, assignment, student, sub_status)

    return enrich_submission(sub)

@router.get("/my", response_model=List[SubmissionResponse])
def get_my_submissions(
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    submissions = db.query(Submission).filter(
        Submission.student_id == student.id
    ).order_by(Submission.submitted_at.desc()).all()

    return [enrich_submission(s) for s in submissions]

@router.get("/assignment/{assignment_id}", response_model=List[SubmissionResponse])
def get_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    submissions = db.query(Submission).filter(
        Submission.assignment_id == assignment_id
    ).order_by(Submission.submitted_at.desc()).all()

    return [enrich_submission(s) for s in submissions]

@router.get("", response_model=List[SubmissionResponse])
def get_all_submissions(
    class_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    query = db.query(Submission).join(Assignment, Submission.assignment_id == Assignment.id).join(User, Submission.student_id == User.id)

    if class_id:
        query = query.filter(Assignment.class_id == class_id)

    if status_filter:
        query = query.filter(Submission.status.ilike(status_filter.strip()))

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            User.full_name.ilike(s) |
            User.email.ilike(s) |
            Assignment.title.ilike(s)
        )

    submissions = query.order_by(Submission.submitted_at.desc()).all()
    return [enrich_submission(s) for s in submissions]

@router.get("/{id}", response_model=SubmissionResponse)
def get_submission_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    # Only admin or submitting student can view
    if current_user.role == "student" and sub.student_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return enrich_submission(sub)

@router.post("/{id}/grade", response_model=SubmissionResponse)
def grade_submission(
    id: int,
    grade_in: SubmissionGrade,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    sub = db.query(Submission).filter(Submission.id == id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    if grade_in.marks_awarded < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Marks cannot be negative")

    if sub.assignment and grade_in.marks_awarded > sub.assignment.total_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Marks awarded cannot exceed assignment maximum ({sub.assignment.total_marks})"
        )

    sub.marks_awarded = grade_in.marks_awarded
    sub.feedback = grade_in.feedback.strip() if grade_in.feedback else None
    sub.status = grade_in.status or "Completed"
    sub.graded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(sub)

    # Notify student
    if sub.assignment:
        notify_submission_graded(
            db=db,
            assignment=sub.assignment,
            student_id=sub.student_id,
            marks=sub.marks_awarded,
            max_marks=sub.assignment.total_marks
        )

    return enrich_submission(sub)
