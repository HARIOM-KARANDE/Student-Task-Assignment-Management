import random
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.core.database import get_db
from backend.app.core.security import get_current_active_user, get_current_admin, get_current_student
from backend.app.models.user import User
from backend.app.models.subject import Subject
from backend.app.models.class_model import Class
from backend.app.models.class_student import ClassStudent
from backend.app.models.assignment import Assignment
from backend.app.schemas.class_schema import (
    ClassCreate,
    ClassUpdate,
    ClassResponse,
    ClassStudentResponse,
    JoinClassRequest
)
from backend.app.schemas.user import UserResponse
from backend.app.services.notification_service import notify_class_enrollment

router = APIRouter(prefix="/classes", tags=["Classes"])

def generate_random_class_code(length=7) -> str:
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace("O", "").replace("0", "").replace("I", "").replace("1", "")
    return "".join(random.choices(chars, k=length))

@router.post("/generate-code")
def generate_code_endpoint(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    for _ in range(10):
        code = generate_random_class_code(7)
        if not db.query(Class).filter(Class.code == code).first():
            return {"code": code}
    return {"code": f"CLS-{generate_random_class_code(6)}"}

@router.get("", response_model=List[ClassResponse])
def get_classes(
    subject_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Class)

    if current_user.role == "student":
        # Students only see classes they have joined!
        joined_class_ids = db.query(ClassStudent.class_id).filter(
            ClassStudent.student_id == current_user.id
        ).subquery()
        query = query.filter(Class.id.in_(joined_class_ids))

    if subject_id:
        query = query.filter(Class.subject_id == subject_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Class.name.ilike(s)) | (Class.code.ilike(s)) | (Class.section.ilike(s)))

    classes = query.order_by(Class.created_at.desc()).all()

    result = []
    for cls in classes:
        resp = ClassResponse.model_validate(cls)
        if cls.subject:
            resp.subject_name = cls.subject.name
            resp.subject_code = cls.subject.code
        resp.students_count = db.query(func.count(ClassStudent.id)).filter(ClassStudent.class_id == cls.id).scalar() or 0
        resp.assignments_count = db.query(func.count(Assignment.id)).filter(Assignment.class_id == cls.id).scalar() or 0
        result.append(resp)
    return result

@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    class_in: ClassCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    # Verify subject exists
    subject = db.query(Subject).filter(Subject.id == class_in.subject_id).first()
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

    # Generate or validate code
    code = class_in.code.strip().upper() if class_in.code else generate_random_class_code(7)
    existing = db.query(Class).filter(Class.code == code).first()
    if existing:
        if class_in.code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Class code '{code}' is already in use")
        else:
            code = f"{generate_random_class_code(4)}-{generate_random_class_code(4)}"

    class_obj = Class(
        subject_id=class_in.subject_id,
        name=class_in.name.strip(),
        section=class_in.section.strip() if class_in.section else None,
        code=code,
        semester=class_in.semester.strip() if class_in.semester else None,
        schedule=class_in.schedule.strip() if class_in.schedule else None,
        max_students=class_in.max_students or 60,
        created_by_id=admin_user.id,
        is_active=True
    )
    db.add(class_obj)
    db.commit()
    db.refresh(class_obj)

    resp = ClassResponse.model_validate(class_obj)
    resp.subject_name = subject.name
    resp.subject_code = subject.code
    resp.students_count = 0
    resp.assignments_count = 0
    return resp

@router.get("/{id}", response_model=ClassResponse)
def get_class_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    class_obj = db.query(Class).filter(Class.id == id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    if current_user.role == "student":
        # Must be enrolled
        enrolled = db.query(ClassStudent).filter(
            ClassStudent.class_id == id,
            ClassStudent.student_id == current_user.id
        ).first()
        if not enrolled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not enrolled in this class"
            )

    resp = ClassResponse.model_validate(class_obj)
    if class_obj.subject:
        resp.subject_name = class_obj.subject.name
        resp.subject_code = class_obj.subject.code
    resp.students_count = db.query(func.count(ClassStudent.id)).filter(ClassStudent.class_id == class_obj.id).scalar() or 0
    resp.assignments_count = db.query(func.count(Assignment.id)).filter(Assignment.class_id == class_obj.id).scalar() or 0
    return resp

@router.put("/{id}", response_model=ClassResponse)
def update_class(
    id: int,
    class_in: ClassUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    class_obj = db.query(Class).filter(Class.id == id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    if class_in.subject_id is not None:
        subject = db.query(Subject).filter(Subject.id == class_in.subject_id).first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        class_obj.subject_id = class_in.subject_id

    if class_in.name is not None:
        class_obj.name = class_in.name.strip()
    if class_in.section is not None:
        class_obj.section = class_in.section.strip()
    if class_in.semester is not None:
        class_obj.semester = class_in.semester.strip()
    if class_in.schedule is not None:
        class_obj.schedule = class_in.schedule.strip()
    if class_in.max_students is not None:
        class_obj.max_students = class_in.max_students
    if class_in.is_active is not None:
        class_obj.is_active = class_in.is_active

    db.commit()
    db.refresh(class_obj)

    resp = ClassResponse.model_validate(class_obj)
    if class_obj.subject:
        resp.subject_name = class_obj.subject.name
        resp.subject_code = class_obj.subject.code
    resp.students_count = db.query(func.count(ClassStudent.id)).filter(ClassStudent.class_id == class_obj.id).scalar() or 0
    resp.assignments_count = db.query(func.count(Assignment.id)).filter(Assignment.class_id == class_obj.id).scalar() or 0
    return resp

@router.delete("/{id}")
def delete_class(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    class_obj = db.query(Class).filter(Class.id == id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    db.delete(class_obj)
    db.commit()
    return {"message": "Class deleted successfully"}

@router.post("/join", response_model=ClassResponse)
def join_class(
    join_in: JoinClassRequest,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    code_clean = join_in.code.strip().upper()
    class_obj = db.query(Class).filter(Class.code == code_clean).first()
    if not class_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid class code. Please check and try again."
        )
    if not class_obj.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This class is currently inactive."
        )

    # Check already enrolled
    already_enrolled = db.query(ClassStudent).filter(
        ClassStudent.class_id == class_obj.id,
        ClassStudent.student_id == student.id
    ).first()
    if already_enrolled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already enrolled in this class."
        )

    # Check max students
    current_count = db.query(func.count(ClassStudent.id)).filter(ClassStudent.class_id == class_obj.id).scalar() or 0
    if current_count >= class_obj.max_students:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This class has reached its maximum student capacity."
        )

    enrollment = ClassStudent(class_id=class_obj.id, student_id=student.id)
    db.add(enrollment)
    db.commit()

    # Trigger notification
    notify_class_enrollment(db, class_obj, student)

    resp = ClassResponse.model_validate(class_obj)
    if class_obj.subject:
        resp.subject_name = class_obj.subject.name
        resp.subject_code = class_obj.subject.code
    resp.students_count = current_count + 1
    resp.assignments_count = db.query(func.count(Assignment.id)).filter(Assignment.class_id == class_obj.id).scalar() or 0
    return resp

@router.get("/{id}/students", response_model=List[ClassStudentResponse])
def get_class_students(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    class_obj = db.query(Class).filter(Class.id == id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    if current_user.role == "student":
        # Must be member
        enrolled = db.query(ClassStudent).filter(
            ClassStudent.class_id == id,
            ClassStudent.student_id == current_user.id
        ).first()
        if not enrolled:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    enrollments = db.query(ClassStudent).filter(ClassStudent.class_id == id).all()
    results = []
    for item in enrollments:
        resp = ClassStudentResponse(
            id=item.id,
            class_id=item.class_id,
            student_id=item.student_id,
            joined_at=item.joined_at,
            student=UserResponse.model_validate(item.student) if item.student else None
        )
        results.append(resp)
    return results

@router.post("/{id}/students/{student_id}")
def add_student_to_class(
    id: int,
    student_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    class_obj = db.query(Class).filter(Class.id == id).first()
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")

    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    existing = db.query(ClassStudent).filter(
        ClassStudent.class_id == id,
        ClassStudent.student_id == student_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Student is already in this class")

    enrollment = ClassStudent(class_id=id, student_id=student_id)
    db.add(enrollment)
    db.commit()

    notify_class_enrollment(db, class_obj, student)
    return {"message": f"Student {student.full_name} added to class successfully"}

@router.delete("/{id}/students/{student_id}")
def remove_student_from_class(
    id: int,
    student_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin)
):
    enrollment = db.query(ClassStudent).filter(
        ClassStudent.class_id == id,
        ClassStudent.student_id == student_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not enrolled in this class")

    db.delete(enrollment)
    db.commit()
    return {"message": "Student removed from class"}

@router.post("/{id}/leave")
def leave_class(
    id: int,
    db: Session = Depends(get_db),
    student: User = Depends(get_current_student)
):
    enrollment = db.query(ClassStudent).filter(
        ClassStudent.class_id == id,
        ClassStudent.student_id == student.id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You are not enrolled in this class")

    db.delete(enrollment)
    db.commit()
    return {"message": "You have left the class"}
