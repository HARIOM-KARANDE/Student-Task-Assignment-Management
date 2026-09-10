from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.security import (
    get_current_admin,
    get_current_student
)
from backend.app.models.user import User
from backend.app.models.subject import Subject
from backend.app.models.class_model import Class
from backend.app.models.class_student import ClassStudent
from backend.app.models.assignment import Assignment
from backend.app.models.submission import Submission
from backend.app.schemas.stats import AdminStats, StudentStats

router = APIRouter(prefix="/stats", tags=["Dashboard Statistics"])

@router.get("/admin", response_model=AdminStats)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    total_subjects = db.query(Subject).count()
    total_classes = db.query(Class).count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_assignments = db.query(Assignment).count()
    total_submissions = db.query(Submission).count()

    pending_reviews = db.query(Submission).filter(
        Submission.graded_at == None
    ).count()

    completed_reviews = db.query(Submission).filter(
        Submission.status == "Completed"
    ).count()

    late_submissions = db.query(Submission).filter(
        Submission.status == "Late"
    ).count()

    completion_rate = 0.0
    if total_submissions > 0:
        completion_rate = round((completed_reviews / total_submissions) * 100, 1)

    # Recent submissions
    recent_subs = db.query(Submission).order_by(Submission.submitted_at.desc()).limit(6).all()
    recent_list = []
    for s in recent_subs:
        recent_list.append({
            "id": s.id,
            "student_name": s.student.full_name if s.student else "Unknown",
            "student_avatar": s.student.avatar_url if s.student else None,
            "assignment_id": s.assignment_id,
            "assignment_title": s.assignment.title if s.assignment else "Untitled",
            "class_name": s.assignment.class_.name if (s.assignment and s.assignment.class_) else "Class",
            "status": s.status,
            "marks_awarded": s.marks_awarded,
            "total_marks": s.assignment.total_marks if s.assignment else 100,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
        })

    # Upcoming deadlines
    now = datetime.now(timezone.utc)
    upcoming = db.query(Assignment).filter(
        Assignment.due_date >= now
    ).order_by(Assignment.due_date.asc()).limit(5).all()

    upcoming_list = []
    for a in upcoming:
        sub_count = db.query(func.count(Submission.id)).filter(Submission.assignment_id == a.id).scalar() or 0
        student_count = db.query(func.count(ClassStudent.id)).filter(ClassStudent.class_id == a.class_id).scalar() or 0
        upcoming_list.append({
            "id": a.id,
            "title": a.title,
            "class_name": a.class_.name if a.class_ else "",
            "subject_name": a.class_.subject.name if (a.class_ and a.class_.subject) else "",
            "due_date": a.due_date.isoformat(),
            "total_marks": a.total_marks,
            "submissions_count": sub_count,
            "total_enrolled": student_count
        })

    return AdminStats(
        total_subjects=total_subjects,
        total_classes=total_classes,
        total_students=total_students,
        total_assignments=total_assignments,
        total_submissions=total_submissions,
        pending_reviews=pending_reviews,
        completed_reviews=completed_reviews,
        late_submissions=late_submissions,
        completion_rate=completion_rate,
        recent_submissions=recent_list,
        upcoming_deadlines=upcoming_list
    )

@router.get("/student", response_model=StudentStats)
def get_student_dashboard_stats(
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    joined_class_ids = [
        item.class_id for item in db.query(ClassStudent).filter(ClassStudent.student_id == student.id).all()
    ]

    enrolled_classes_count = len(joined_class_ids)

    if not joined_class_ids:
        return StudentStats(
            enrolled_classes_count=0,
            pending_assignments_count=0,
            completed_assignments_count=0,
            late_submissions_count=0,
            upcoming_deadlines=[],
            recent_activity=[]
        )

    # Submissions made by student
    my_submissions = db.query(Submission).filter(Submission.student_id == student.id).all()
    submitted_assignment_ids = {s.assignment_id for s in my_submissions}
    sub_map = {s.assignment_id: s for s in my_submissions}

    # All assignments in joined classes
    all_asgs = db.query(Assignment).filter(Assignment.class_id.in_(joined_class_ids)).all()

    now = datetime.now(timezone.utc)

    pending_count = 0
    completed_count = 0
    late_count = 0

    for a in all_asgs:
        due = a.due_date
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)

        if a.id in submitted_assignment_ids:
            s = sub_map[a.id]
            if s.status == "Completed":
                completed_count += 1
            elif s.status == "Late":
                late_count += 1
            elif s.status == "Submitted":
                # If graded, mark completed, else submitted count
                if s.marks_awarded is not None:
                    completed_count += 1
                else:
                    pending_count += 1
        else:
            # Not submitted
            if now > due:
                late_count += 1
            else:
                pending_count += 1

    # Upcoming deadlines
    upcoming = [a for a in all_asgs if ((a.due_date.replace(tzinfo=timezone.utc) if a.due_date.tzinfo is None else a.due_date) >= now)]
    upcoming.sort(key=lambda x: x.due_date)

    upcoming_list = []
    for a in upcoming[:6]:
        s = sub_map.get(a.id)
        due = a.due_date.replace(tzinfo=timezone.utc) if a.due_date.tzinfo is None else a.due_date
        upcoming_list.append({
            "id": a.id,
            "title": a.title,
            "class_name": a.class_.name if a.class_ else "",
            "subject_name": a.class_.subject.name if (a.class_ and a.class_.subject) else "",
            "due_date": due.isoformat(),
            "total_marks": a.total_marks,
            "status": s.status if s else "Pending",
            "is_submitted": s is not None
        })

    # Recent activity
    recent_activity = []
    recent_subs = db.query(Submission).filter(
        Submission.student_id == student.id
    ).order_by(Submission.submitted_at.desc()).limit(6).all()

    for s in recent_subs:
        recent_activity.append({
            "id": s.id,
            "title": s.assignment.title if s.assignment else "Assignment",
            "class_name": s.assignment.class_.name if (s.assignment and s.assignment.class_) else "Class",
            "status": s.status,
            "marks_awarded": s.marks_awarded,
            "total_marks": s.assignment.total_marks if s.assignment else 100,
            "feedback": s.feedback,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None
        })

    return StudentStats(
        enrolled_classes_count=enrolled_classes_count,
        pending_assignments_count=pending_count,
        completed_assignments_count=completed_count,
        late_submissions_count=late_count,
        upcoming_deadlines=upcoming_list,
        recent_activity=recent_activity
    )
