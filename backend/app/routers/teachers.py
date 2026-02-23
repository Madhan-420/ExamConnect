"""
Teacher Router
Exam CRUD, question management, submission review, result publishing
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import (
    ExamCreate, ExamUpdate, ExamResponse, QuestionCreate,
    EvaluateSubmission, TeacherDashboard
)
from app.services.supabase import get_supabase_admin
from app.middleware.auth import require_role
from typing import List

router = APIRouter()


@router.get("/dashboard", response_model=TeacherDashboard)
async def teacher_dashboard(current_user: dict = Depends(require_role("teacher"))):
    """Get teacher dashboard statistics."""
    try:
        sb = get_supabase_admin()
        teacher_id = current_user["id"]

        # Teacher's exams
        exams = sb.table("exams").select("*").eq("teacher_id", teacher_id).execute()
        exam_list = exams.data or []
        exam_ids = [e["id"] for e in exam_list]

        active_exams = sum(1 for e in exam_list if e["status"] in ("scheduled", "active"))

        # Submissions for teacher's exams
        total_submissions = 0
        pending_evaluations = 0
        if exam_ids:
            for eid in exam_ids:
                subs = sb.table("submissions").select("id, status").eq("exam_id", eid).execute()
                sub_list = subs.data or []
                total_submissions += len(sub_list)
                pending_evaluations += sum(1 for s in sub_list if s["status"] == "submitted")

        # Recent exams
        recent = sb.table("exams").select("*").eq("teacher_id", teacher_id).order("created_at", desc=True).limit(5).execute()

        return TeacherDashboard(
            total_exams=len(exam_list),
            active_exams=active_exams,
            total_submissions=total_submissions,
            pending_evaluations=pending_evaluations,
            recent_exams=recent.data or []
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")


# ──── Exam CRUD ────

@router.get("/exams", response_model=list)
async def list_exams(current_user: dict = Depends(require_role("teacher"))):
    """List all exams created by this teacher."""
    try:
        sb = get_supabase_admin()
        result = sb.table("exams").select("*").eq("teacher_id", current_user["id"]).order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/exams", response_model=dict)
async def create_exam(exam: ExamCreate, current_user: dict = Depends(require_role("teacher"))):
    """Create a new exam."""
    try:
        sb = get_supabase_admin()
        exam_data = {
            **exam.model_dump(),
            "teacher_id": current_user["id"],
            "status": "draft"
        }
        result = sb.table("exams").insert(exam_data).execute()
        return {"message": "Exam created", "exam": result.data[0] if result.data else {}}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create exam: {str(e)}")


@router.get("/exams/{exam_id}", response_model=dict)
async def get_exam(exam_id: str, current_user: dict = Depends(require_role("teacher"))):
    """Get exam details."""
    try:
        sb = get_supabase_admin()
        result = sb.table("exams").select("*").eq("id", exam_id).eq("teacher_id", current_user["id"]).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/exams/{exam_id}", response_model=dict)
async def update_exam(
    exam_id: str,
    update: ExamUpdate,
    current_user: dict = Depends(require_role("teacher"))
):
    """Update an exam."""
    try:
        sb = get_supabase_admin()
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        if "status" in update_data:
            update_data["status"] = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        sb.table("exams").update(update_data).eq("id", exam_id).eq("teacher_id", current_user["id"]).execute()
        return {"message": "Exam updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/exams/{exam_id}", response_model=dict)
async def delete_exam(exam_id: str, current_user: dict = Depends(require_role("teacher"))):
    """Delete an exam."""
    try:
        sb = get_supabase_admin()
        sb.table("exams").delete().eq("id", exam_id).eq("teacher_id", current_user["id"]).execute()
        return {"message": "Exam deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ──── Questions ────

@router.post("/exams/{exam_id}/questions", response_model=dict)
async def add_questions(
    exam_id: str,
    questions: List[QuestionCreate],
    current_user: dict = Depends(require_role("teacher"))
):
    """Add questions to an exam (batch)."""
    try:
        sb = get_supabase_admin()

        # Verify exam ownership
        exam = sb.table("exams").select("id").eq("id", exam_id).eq("teacher_id", current_user["id"]).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        # Insert questions
        question_data = []
        for q in questions:
            qd = q.model_dump()
            qd["exam_id"] = exam_id
            if qd.get("options"):
                import json
                qd["options"] = json.dumps(qd["options"])
            question_data.append(qd)

        result = sb.table("questions").insert(question_data).execute()
        return {"message": f"{len(questions)} questions added", "questions": result.data or []}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/exams/{exam_id}/questions", response_model=list)
async def get_questions(exam_id: str, current_user: dict = Depends(require_role("teacher"))):
    """Get all questions for an exam."""
    try:
        sb = get_supabase_admin()
        result = sb.table("questions").select("*").eq("exam_id", exam_id).order("order_num").execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──── Exam Status Management ────

@router.post("/exams/{exam_id}/publish", response_model=dict)
async def publish_exam(
    exam_id: str,
    current_user: dict = Depends(require_role("teacher"))
):
    """Schedule/activate an exam (change status from draft → scheduled)."""
    try:
        sb = get_supabase_admin()
        exam = sb.table("exams").select("*").eq("id", exam_id).eq("teacher_id", current_user["id"]).single().execute()

        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        if exam.data["status"] not in ("draft", "scheduled"):
            raise HTTPException(status_code=400, detail="Can only publish draft or scheduled exams")

        sb.table("exams").update({"status": "scheduled"}).eq("id", exam_id).execute()
        return {"message": "Exam scheduled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ──── Submissions / Evaluation ────

@router.get("/exams/{exam_id}/submissions", response_model=list)
async def get_submissions(exam_id: str, current_user: dict = Depends(require_role("teacher"))):
    """View all submissions for an exam."""
    try:
        sb = get_supabase_admin()

        # Verify exam ownership
        exam = sb.table("exams").select("id").eq("id", exam_id).eq("teacher_id", current_user["id"]).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        subs = sb.table("submissions").select("*").eq("exam_id", exam_id).order("submitted_at", desc=True).execute()

        # Enrich with student info
        submissions = subs.data or []
        for sub in submissions:
            student = sb.table("profiles").select("full_name, email, reg_number").eq("id", sub["student_id"]).single().execute()
            if student.data:
                sub["student"] = student.data

        return submissions

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submissions/{submission_id}/evaluate", response_model=dict)
async def evaluate_submission(
    submission_id: str,
    evaluation: EvaluateSubmission,
    current_user: dict = Depends(require_role("teacher"))
):
    """Grade a student submission."""
    try:
        sb = get_supabase_admin()

        # Get submission
        sub = sb.table("submissions").select("*").eq("id", submission_id).single().execute()
        if not sub.data:
            raise HTTPException(status_code=404, detail="Submission not found")

        # Get exam to verify ownership and total marks
        exam = sb.table("exams").select("*").eq("id", sub.data["exam_id"]).eq("teacher_id", current_user["id"]).single().execute()
        if not exam.data:
            raise HTTPException(status_code=403, detail="Not authorized to evaluate this submission")

        total_marks = exam.data["total_marks"]
        if evaluation.marks_obtained > total_marks:
            raise HTTPException(status_code=400, detail=f"Marks cannot exceed total marks ({total_marks})")

        percentage = round((evaluation.marks_obtained / total_marks) * 100, 2)

        # Determine grade
        if percentage >= 90:
            grade = "A+"
        elif percentage >= 80:
            grade = "A"
        elif percentage >= 70:
            grade = "B+"
        elif percentage >= 60:
            grade = "B"
        elif percentage >= 50:
            grade = "C"
        elif percentage >= 40:
            grade = "D"
        else:
            grade = "F"

        # Insert/update result
        result_data = {
            "exam_id": sub.data["exam_id"],
            "student_id": sub.data["student_id"],
            "submission_id": submission_id,
            "marks_obtained": evaluation.marks_obtained,
            "total_marks": total_marks,
            "percentage": percentage,
            "grade": grade,
            "remarks": evaluation.remarks,
            "evaluated_by": current_user["id"],
            "published": False
        }

        # Check if result already exists
        existing = sb.table("results").select("id").eq("submission_id", submission_id).execute()
        if existing.data:
            sb.table("results").update(result_data).eq("submission_id", submission_id).execute()
        else:
            sb.table("results").insert(result_data).execute()

        # Update submission status
        sb.table("submissions").update({"status": "evaluated"}).eq("id", submission_id).execute()

        return {"message": "Submission evaluated", "grade": grade, "percentage": percentage}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/exams/{exam_id}/publish-results", response_model=dict)
async def publish_results(exam_id: str, current_user: dict = Depends(require_role("teacher"))):
    """Publish all results for an exam."""
    try:
        sb = get_supabase_admin()

        # Verify ownership
        exam = sb.table("exams").select("id").eq("id", exam_id).eq("teacher_id", current_user["id"]).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        # Publish all results
        sb.table("results").update({"published": True}).eq("exam_id", exam_id).execute()

        # Update exam status
        sb.table("exams").update({"status": "results_published"}).eq("id", exam_id).execute()

        return {"message": "Results published successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
