from typing import List
from sqlalchemy.orm import Session
from backend.app.models.notification import Notification
from backend.app.models.class_student import ClassStudent
from backend.app.models.assignment import Assignment
from backend.app.models.class_model import Class
from backend.app.models.user import User

def send_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str = "info",
    link: str = None
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        link=link,
        is_read=False
    )
    db.add(notif)
    return notif

def notify_new_assignment(db: Session, assignment: Assignment, class_obj: Class):
    enrollments = db.query(ClassStudent).filter(ClassStudent.class_id == class_obj.id).all()
    due_str = assignment.due_date.strftime('%b %d, %Y %I:%M %p') if assignment.due_date else 'No due date'
    for item in enrollments:
        send_notification(
            db=db,
            user_id=item.student_id,
            title=f"New Assignment: {assignment.title}",
            message=f"A new assignment has been posted in {class_obj.name}. Due on {due_str}.",
            notif_type="assignment_new",
            link=f"/student/assignments/{assignment.id}"
        )
    db.commit()

def notify_assignment_updated(db: Session, assignment: Assignment, class_obj: Class):
    enrollments = db.query(ClassStudent).filter(ClassStudent.class_id == class_obj.id).all()
    for item in enrollments:
        send_notification(
            db=db,
            user_id=item.student_id,
            title=f"Assignment Updated: {assignment.title}",
            message=f"Details or deadline for assignment '{assignment.title}' in {class_obj.name} have been updated.",
            notif_type="assignment_updated",
            link=f"/student/assignments/{assignment.id}"
        )
    db.commit()

def notify_submission_received(db: Session, assignment: Assignment, student: User, status: str):
    if assignment.created_by_id:
        send_notification(
            db=db,
            user_id=assignment.created_by_id,
            title=f"New Submission: {assignment.title}",
            message=f"Student {student.full_name} submitted their assignment with status: {status}.",
            notif_type="submission_received",
            link=f"/admin/assignments/{assignment.id}/submissions"
        )
    db.commit()

def notify_submission_graded(db: Session, assignment: Assignment, student_id: int, marks: float, max_marks: int):
    send_notification(
        db=db,
        user_id=student_id,
        title=f"Assignment Graded: {assignment.title}",
        message=f"Your submission for '{assignment.title}' was reviewed. Marks awarded: {marks}/{max_marks}.",
        notif_type="assignment_updated",
        link=f"/student/assignments/{assignment.id}"
    )
    db.commit()

def notify_class_enrollment(db: Session, class_obj: Class, student: User):
    send_notification(
        db=db,
        user_id=student.id,
        title=f"Enrolled in {class_obj.name}",
        message=f"You successfully joined {class_obj.name}. Class code: {class_obj.code}.",
        notif_type="class_activity",
        link=f"/student/classes/{class_obj.id}"
    )
    if class_obj.created_by_id:
        send_notification(
            db=db,
            user_id=class_obj.created_by_id,
            title=f"New Student in {class_obj.name}",
            message=f"{student.full_name} ({student.email}) joined your class.",
            notif_type="class_activity",
            link=f"/admin/classes/{class_obj.id}"
        )
    db.commit()
