from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class SubmissionCreate(BaseModel):
    submission_text: Optional[str] = None

class SubmissionGrade(BaseModel):
    marks_awarded: float
    feedback: Optional[str] = None
    status: Optional[str] = "Completed"

class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assignment_id: int
    student_id: int
    solution_file_url: Optional[str] = None
    submission_text: Optional[str] = None
    status: str  # Pending, Submitted, Completed, Late
    marks_awarded: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: datetime
    graded_at: Optional[datetime] = None

    # Enriched fields
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    assignment_title: Optional[str] = None
    total_marks: Optional[int] = None
    class_name: Optional[str] = None
    subject_name: Optional[str] = None
    due_date: Optional[datetime] = None
