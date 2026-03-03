"""
Pydantic Models / Schemas for Exam Connect
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ──── Enums ────

class UserRole(str, Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"


class UserGender(str, Enum):
    male = "male"
    female = "female"


class ExamStatus(str, Enum):
    draft = "draft"
    scheduled = "scheduled"
    active = "active"
    completed = "completed"
    results_published = "results_published"


class QuestionType(str, Enum):
    mcq = "mcq"
    text = "text"
    file_upload = "file_upload"


# ──── Auth ────

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    role: UserRole = UserRole.student
    gender: UserGender       # New field
    department: Optional[str] = None
    reg_number: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    gender: str              # New field
    department: Optional[str] = None
    reg_number: Optional[str] = None
    created_at: Optional[str] = None
    mentor_id: Optional[str] = None
    last_seen: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    gender: Optional[UserGender] = None
    department: Optional[str] = None
    reg_number: Optional[str] = None
    mentor_id: Optional[str] = None


# ──── Exams ────

class ExamCreate(BaseModel):
    title: str = Field(min_length=3)
    subject: str
    description: Optional[str] = None
    scheduled_at: str  # ISO datetime string
    duration_minutes: int = Field(ge=5, le=480)
    total_marks: int = Field(ge=1)


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[int] = None
    status: Optional[ExamStatus] = None


class ExamResponse(BaseModel):
    id: str
    title: str
    subject: str
    description: Optional[str] = None
    teacher_id: str
    scheduled_at: str
    duration_minutes: int
    total_marks: int
    status: str
    created_at: Optional[str] = None


# ──── Questions ────

class QuestionCreate(BaseModel):
    question_text: str
    question_type: QuestionType = QuestionType.text
    options: Optional[List[str]] = None  # For MCQ
    correct_answer: Optional[str] = None
    marks: int = Field(ge=1)
    order_num: int = Field(ge=1)
    file_url: Optional[str] = None    # Teacher-attached file for this question
    file_name: Optional[str] = None


class QuestionResponse(BaseModel):
    id: str
    exam_id: str
    question_text: str
    question_type: str
    options: Optional[Any] = None
    correct_answer: Optional[str] = None
    marks: int
    order_num: int


# ──── Submissions ────

class SubmissionCreate(BaseModel):
    answers: dict  # { question_id: answer_value }
    file_url: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: str
    exam_id: str
    student_id: str
    answers: Any
    file_url: Optional[str] = None
    submitted_at: Optional[str] = None
    status: str


# ──── Results ────

class EvaluateSubmission(BaseModel):
    marks_obtained: int = Field(ge=0)
    remarks: Optional[str] = None


class ResultResponse(BaseModel):
    id: str
    exam_id: str
    student_id: str
    submission_id: Optional[str] = None
    marks_obtained: int
    total_marks: int
    percentage: Optional[float] = None
    grade: Optional[str] = None
    remarks: Optional[str] = None
    evaluated_by: Optional[str] = None
    published: bool = False
    evaluated_at: Optional[str] = None


# ──── Dashboard ────

class AdminDashboard(BaseModel):
    total_users: int
    total_teachers: int
    total_students: int
    total_exams: int
    total_submissions: int
    recent_exams: List[dict] = []


class TeacherDashboard(BaseModel):
    total_exams: int
    active_exams: int
    total_submissions: int
    pending_evaluations: int
    recent_exams: List[dict] = []


class StudentDashboard(BaseModel):
    upcoming_exams: List[dict] = []
    completed_exams: int
    total_submissions: int
    average_percentage: Optional[float] = None
    recent_results: List[dict] = []


# ──── Feedback & Complaints ────

class FeedbackCreate(BaseModel):
    subject: str = Field(min_length=3)
    message: str = Field(min_length=5)

class FeedbackResponse(BaseModel):
    id: str
    user_id: str
    subject: str
    message: str
    status: str
    created_at: Optional[str] = None
    user_name: Optional[str] = None # Added for convenience


# ──── Attendance ────

class AttendanceCreate(BaseModel):
    student_id: str
    date: str # ISO Date string YYYY-MM-DD
    status: str # 'present', 'absent', 'late'
    remarks: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: str
    student_id: str
    teacher_id: str
    date: str
    status: str
    remarks: Optional[str] = None
    created_at: Optional[str] = None


# ──── Internal Marks ────

class InternalMarksCreate(BaseModel):
    student_id: str
    subject: str
    marks: int = Field(ge=0)
    total_marks: int = Field(ge=1)

class InternalMarksResponse(BaseModel):
    id: str
    student_id: str
    teacher_id: str
    subject: str
    marks: int
    total_marks: int
    created_at: Optional[str] = None

