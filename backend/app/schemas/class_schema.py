from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.user import UserResponse

class ClassBase(BaseModel):
    name: str
    section: Optional[str] = None
    semester: Optional[str] = None
    schedule: Optional[str] = None
    max_students: int = 60

class ClassCreate(ClassBase):
    subject_id: int
    code: Optional[str] = None  # If not provided, automatically generated

class ClassUpdate(BaseModel):
    subject_id: Optional[int] = None
    name: Optional[str] = None
    section: Optional[str] = None
    semester: Optional[str] = None
    schedule: Optional[str] = None
    max_students: Optional[int] = None
    is_active: Optional[bool] = None

class ClassStudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_id: int
    student_id: int
    joined_at: datetime
    student: Optional[UserResponse] = None

class ClassResponse(ClassBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject_id: int
    code: str
    created_by_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    students_count: int = 0
    assignments_count: int = 0

class JoinClassRequest(BaseModel):
    code: str
