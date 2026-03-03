"""
Student Router
View exams, submit answers, view results
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import SubmissionCreate, StudentDashboard
from app.services.supabase import get_supabase_admin
from app.middleware.auth import require_role
from datetime import datetime, timezone

router = APIRouter()


@router.get("/dashboard", response_model=StudentDashboard)
async def student_dashboard(current_user: dict = Depends(require_role("student"))):
    """Get student dashboard statistics."""
    try:
        sb = get_supabase_admin()
        student_id = current_user["id"]

        # Upcoming / active exams
        exams = sb.table("exams").select("*").in_("status", ["scheduled", "active"]).order("scheduled_at").execute()
        upcoming = exams.data or []

        # Student's submissions
        subs = sb.table("submissions").select("*").eq("student_id", student_id).execute()
        total_submissions = len(subs.data or [])

        # Completed exams (submitted)
        submitted_exam_ids = [s["exam_id"] for s in (subs.data or [])]
        completed_exams = len(set(submitted_exam_ids))

        # Published results
        results = sb.table("results").select("*").eq("student_id", student_id).eq("published", True).execute()
        result_list = results.data or []

        average_percentage = None
        if result_list:
            percentages = [r["percentage"] for r in result_list if r.get("percentage") is not None]
            if percentages:
                average_percentage = round(sum(percentages) / len(percentages), 2)

        # Enrich results with exam info
        recent_results = []
        for r in result_list[:5]:
            exam = sb.table("exams").select("title, subject").eq("id", r["exam_id"]).single().execute()
            if exam.data:
                r["exam"] = exam.data
            recent_results.append(r)

        return StudentDashboard(
            upcoming_exams=upcoming,
            completed_exams=completed_exams,
            total_submissions=total_submissions,
            average_percentage=average_percentage,
            recent_results=recent_results
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard error: {str(e)}")


@router.get("/exams", response_model=list)
async def list_available_exams(current_user: dict = Depends(require_role("student"))):
    """List all scheduled/active exams for students."""
    try:
        sb = get_supabase_admin()
        result = sb.table("exams").select("*").in_("status", ["scheduled", "active"]).order("scheduled_at").execute()

        exams = result.data or []

        # Mark which exams student already submitted
        student_id = current_user["id"]
        subs = sb.table("submissions").select("exam_id").eq("student_id", student_id).execute()
        submitted_ids = {s["exam_id"] for s in (subs.data or [])}

        for exam in exams:
            exam["already_submitted"] = exam["id"] in submitted_ids
            # Enrich with teacher name
            teacher = sb.table("profiles").select("full_name").eq("id", exam["teacher_id"]).single().execute()
            if teacher.data:
                exam["teacher_name"] = teacher.data["full_name"]

        return exams

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exams/{exam_id}", response_model=dict)
async def get_exam_with_questions(exam_id: str, current_user: dict = Depends(require_role("student"))):
    """Get exam details with questions (for taking exam)."""
    try:
        sb = get_supabase_admin()

        # Get exam
        exam = sb.table("exams").select("*").eq("id", exam_id).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        if exam.data["status"] not in ("scheduled", "active"):
            raise HTTPException(status_code=400, detail="This exam is not available")

        # Check if already submitted
        existing = sb.table("submissions").select("id").eq("exam_id", exam_id).eq("student_id", current_user["id"]).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="You have already submitted this exam")

        # Get questions (hide correct answers)
        questions = sb.table("questions").select("*").eq("exam_id", exam_id).order("order_num").execute()
        q_list = questions.data or []
        for q in q_list:
            q.pop("correct_answer", None)  # Hide answers from students

        exam_data = exam.data
        exam_data["questions"] = q_list

        return exam_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exams/{exam_id}/download")
async def download_exam_questions(exam_id: str, current_user: dict = Depends(require_role("student"))):
    """Download exam questions as a plaintext file."""
    import json as _json
    try:
        sb = get_supabase_admin()
        exam = sb.table("exams").select("*").eq("id", exam_id).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        if exam.data["status"] not in ("scheduled", "active"):
            raise HTTPException(status_code=400, detail="Exam not available")
        questions = sb.table("questions").select("*").eq("exam_id", exam_id).order("order_num").execute()
        lines = [f"EXAM: {exam.data['title']}\nSubject: {exam.data['subject']}\nDuration: {exam.data['duration_minutes']} minutes\nTotal Marks: {exam.data['total_marks']}\n{'='*60}\n"]
        for q in (questions.data or []):
            qd = {k: v for k, v in q.items() if k != 'correct_answer'}  # hide answers
            opts = ""
            if qd.get("options"):
                opts_data = qd["options"] if isinstance(qd["options"], list) else _json.loads(qd["options"])
                opts = "\n".join(f"   {chr(65+i)}) {o}" for i, o in enumerate(opts_data))
                opts = f"\n{opts}"
            file_ref = f"\n   [Attachment: {qd.get('file_name','file')} - {qd.get('file_url','')}]" if qd.get('file_url') else ""
            lines.append(f"Q{qd['order_num']}. [{qd['question_type'].upper()}] ({qd['marks']} marks)\n{qd['question_text']}{opts}{file_ref}\n")
        content = "\n".join(lines)
        from fastapi.responses import Response
        return Response(content=content, media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename={exam.data['title'].replace(' ','_')}_questions.txt"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/exams/{exam_id}/submit", response_model=dict)
async def submit_exam(
    exam_id: str,
    submission: SubmissionCreate,
    current_user: dict = Depends(require_role("student"))
):
    """Submit answers for an exam. Accepts text/MCQ answers and optional PDF file URL."""
    try:
        sb = get_supabase_admin()
        student_id = current_user["id"]

        exam = sb.table("exams").select("*").eq("id", exam_id).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")

        if exam.data["status"] not in ("scheduled", "active"):
            raise HTTPException(status_code=400, detail="This exam is not accepting submissions")

        existing = sb.table("submissions").select("id").eq("exam_id", exam_id).eq("student_id", student_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Already submitted this exam")

        sub_data = {
            "exam_id": exam_id,
            "student_id": student_id,
            "answers": submission.answers or {},
            "file_url": submission.file_url,
            "status": "submitted"
        }

        result = sb.table("submissions").insert(sub_data).execute()
        return {"message": "Exam submitted successfully", "submission_id": result.data[0]["id"] if result.data else None}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/exams/{exam_id}/upload", response_model=dict)
async def upload_answer_file(exam_id: str, current_user: dict = Depends(require_role("student"))):
    """Placeholder for direct backend file upload (Supabase Storage preferred)."""
    return {"file_url": None, "message": "Use Supabase Storage for file uploads"}



@router.get("/results", response_model=list)
async def get_results(current_user: dict = Depends(require_role("student"))):
    """Get all published results for the current student."""
    try:
        sb = get_supabase_admin()
        student_id = current_user["id"]

        results = sb.table("results").select("*").eq("student_id", student_id).eq("published", True).order("evaluated_at", desc=True).execute()

        result_list = results.data or []

        # Enrich with exam info
        for r in result_list:
            exam = sb.table("exams").select("title, subject, total_marks, scheduled_at").eq("id", r["exam_id"]).single().execute()
            if exam.data:
                r["exam"] = exam.data

        return result_list

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
