from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    question_text: Optional[str] = None
    total_marks: int = 100
    due_date: datetime

class AssignmentCreate(AssignmentBase):
    class_id: int

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    question_text: Optional[str] = None
    total_marks: Optional[int] = None
    due_date: Optional[datetime] = None

class AssignmentResponse(AssignmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_id: int
    question_file_url: Optional[str] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    class_name: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    submissions_count: int = 0
    my_submission: Optional[Any] = None  # Submission info for students
