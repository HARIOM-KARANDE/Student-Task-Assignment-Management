from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.app.schemas.submission import SubmissionResponse
from backend.app.schemas.assignment import AssignmentResponse

class AdminStats(BaseModel):
    total_subjects: int
    total_classes: int
    total_students: int
    total_assignments: int
    total_submissions: int
    pending_reviews: int
    completed_reviews: int
    late_submissions: int
    completion_rate: float
    recent_submissions: List[Dict[str, Any]]
    upcoming_deadlines: List[Dict[str, Any]]

class StudentStats(BaseModel):
    enrolled_classes_count: int
    pending_assignments_count: int
    completed_assignments_count: int
    late_submissions_count: int
    upcoming_deadlines: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
