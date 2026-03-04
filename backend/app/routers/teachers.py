"""
Teacher Router
Exam CRUD, question management, submission review, result publishing
"""

from fastapi import APIRouter, HTTPException, status, Depends, Body
from app.models.schemas import (
    ExamCreate, ExamUpdate, ExamResponse, QuestionCreate,
    EvaluateSubmission, TeacherDashboard
)
from app.services.supabase import get_supabase_admin
from app.middleware.auth import require_role
from typing import List, Dict, Any

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
            # Keep file_url/file_name if present
            question_data.append({k: v for k, v in qd.items() if v is not None})

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


from fastapi.responses import PlainTextResponse, JSONResponse as FJSONResponse
import json as _json

@router.get("/exams/{exam_id}/questions/download")
async def download_questions(exam_id: str, current_user: dict = Depends(require_role("teacher"))):
    """Download all questions for an exam as a plaintext file."""
    try:
        sb = get_supabase_admin()
        exam = sb.table("exams").select("*").eq("id", exam_id).eq("teacher_id", current_user["id"]).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        questions = sb.table("questions").select("*").eq("exam_id", exam_id).order("order_num").execute()
        lines = [f"EXAM: {exam.data['title']}\nSubject: {exam.data['subject']}\nDuration: {exam.data['duration_minutes']} minutes\nTotal Marks: {exam.data['total_marks']}\n{'='*60}\n"]
        for q in (questions.data or []):
            opts = ""
            if q.get("options"):
                opts_data = q["options"] if isinstance(q["options"], list) else _json.loads(q["options"])
                opts = "\n".join(f"   {chr(65+i)}) {o}" for i, o in enumerate(opts_data))
                opts = f"\n{opts}"
            file_ref = f"\n   [Attached: {q.get('file_name', 'file')} - {q.get('file_url', '')}]" if q.get('file_url') else ""
            lines.append(f"Q{q['order_num']}. [{q['question_type'].upper()}] ({q['marks']} marks)\n{q['question_text']}{opts}{file_ref}\n")
        content = "\n".join(lines)
        from fastapi.responses import Response
        return Response(content=content, media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=exam_{exam_id}_questions.txt"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exams/{exam_id}/submissions/download")
async def download_submissions(exam_id: str, current_user: dict = Depends(require_role("teacher"))):
    """Download all submissions for an exam as JSON."""
    try:
        sb = get_supabase_admin()
        exam = sb.table("exams").select("id").eq("id", exam_id).eq("teacher_id", current_user["id"]).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        subs = sb.table("submissions").select("*").eq("exam_id", exam_id).order("submitted_at", desc=True).execute()
        submissions = subs.data or []
        for sub in submissions:
            student = sb.table("profiles").select("full_name, email, reg_number").eq("id", sub["student_id"]).single().execute()
            sub["student"] = student.data or {}
        content = _json.dumps(submissions, indent=2, default=str)
        from fastapi.responses import Response
        return Response(content=content, media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=exam_{exam_id}_submissions.json"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




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
        from datetime import datetime, timezone
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
        marks = evaluation.marks_obtained
        if marks > total_marks:
            raise HTTPException(status_code=400, detail=f"Marks ({marks}) cannot exceed total marks ({total_marks})")

        percentage = round((marks / total_marks) * 100, 2) if total_marks > 0 else 0

        grade = "A+" if percentage >= 90 else "A" if percentage >= 80 else "B+" if percentage >= 70 else "B" if percentage >= 60 else "C" if percentage >= 50 else "D" if percentage >= 40 else "F"

        now_iso = datetime.now(timezone.utc).isoformat()

        result_data = {
            "exam_id": sub.data["exam_id"],
            "student_id": sub.data["student_id"],
            "submission_id": submission_id,
            "marks_obtained": marks,
            "total_marks": total_marks,
            "percentage": percentage,
            "grade": grade,
            "remarks": evaluation.remarks,
            "evaluated_by": current_user["id"],
            "evaluated_at": now_iso,
            "published": False,
        }

        # Use upsert to avoid insert/update conflicts
        try:
            sb.table("results").upsert(result_data, on_conflict="submission_id").execute()
        except Exception:
            # Fallback: try plain insert, then update
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
        import traceback
        raise HTTPException(status_code=400, detail=f"Evaluation failed: {str(e)}\n{traceback.format_exc()}") 



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


# ──── Mentorship, Attendance, Internal Marks, Feedbacks ────

@router.get("/my-students", response_model=list)
async def get_assigned_students(current_user: dict = Depends(require_role("teacher"))):
    """Get all students assigned to this teacher as their mentor."""
    try:
        sb = get_supabase_admin()
        students = sb.table("profiles").select("*").eq("mentor_id", current_user["id"]).order("full_name").execute()
        return students.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedbacks", response_model=dict)
async def submit_feedback(
    feedback: dict, # using raw dict since FeedbackCreate was just added
    current_user: dict = Depends(require_role("teacher"))
):
    """Submit a feedback/complaint as a teacher."""
    try:
        sb = get_supabase_admin()
        data = {
            "user_id": current_user["id"],
            "subject": feedback.get("subject"),
            "message": feedback.get("message"),
            "status": "pending"
        }
        sb.table("feedbacks").insert(data).execute()
        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/feedbacks", response_model=list)
async def get_teacher_feedbacks(current_user: dict = Depends(require_role("teacher"))):
    """Get all feedbacks submitted by this teacher."""
    try:
        sb = get_supabase_admin()
        feedbacks = sb.table("feedbacks").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
        return feedbacks.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/attendance", response_model=dict)
async def mark_attendance(
    attendance_data: List[Dict[str, Any]] = Body(...), # List of dicts: student_id, date, status, remarks
    current_user: dict = Depends(require_role("teacher"))
):
    """Batch insert/update attendance for students."""
    try:
        sb = get_supabase_admin()
        
        insert_data = []
        for a in attendance_data:
            insert_data.append({
                "student_id": a.get("student_id"),
                "teacher_id": current_user["id"],
                "date": a.get("date"),
                "status": a.get("status"),
                "remarks": a.get("remarks")
            })

        # Batch upsert by student_id and date
        try:
            sb.table("attendance").upsert(insert_data, on_conflict="student_id,date").execute()
        except Exception:
            # Fallback for Python client versions or DBs that don't allow batch upsert nicely
            for data in insert_data:
                existing = sb.table("attendance").select("id").eq("student_id", data["student_id"]).eq("date", data["date"]).execute()
                if existing.data:
                    sb.table("attendance").update(data).eq("id", existing.data[0]["id"]).execute()
                else:
                    sb.table("attendance").insert(data).execute()
                
        return {"message": "Attendance marked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/attendance", response_model=list)
async def get_attendance(
    date: str = None, 
    current_user: dict = Depends(require_role("teacher"))
):
    """Get attendance records. Filter by date if provided."""
    try:
        sb = get_supabase_admin()
        query = sb.table("attendance").select("*, profiles!student_id(full_name, reg_number)").eq("teacher_id", current_user["id"]).order("date", desc=True)
        if date:
            query = query.eq("date", date)
        result = query.execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/internal-marks", response_model=dict)
async def add_internal_marks(
    marks_data: List[Dict[str, Any]] = Body(...), # list of student_id, subject, marks, total_marks
    current_user: dict = Depends(require_role("teacher"))
):
    """Batch insert/update internal marks."""
    try:
        sb = get_supabase_admin()
        for m in marks_data:
            data = {
                "student_id": m.get("student_id"),
                "teacher_id": current_user["id"],
                "subject": m.get("subject"),
                "marks": m.get("marks"),
                "total_marks": m.get("total_marks")
            }
            existing = sb.table("internal_marks").select("id").eq("student_id", data["student_id"]).eq("subject", data["subject"]).execute()
            if existing.data:
                sb.table("internal_marks").update(data).eq("id", existing.data[0]["id"]).execute()
            else:
                sb.table("internal_marks").insert(data).execute()

        return {"message": "Internal marks updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/internal-marks", response_model=list)
async def get_internal_marks(
    subject: str = None,
    current_user: dict = Depends(require_role("teacher"))
):
    """Get internal marks. Filter by subject if provided."""
    try:
        sb = get_supabase_admin()
        query = sb.table("internal_marks").select("*, profiles!student_id(full_name, reg_number)").eq("teacher_id", current_user["id"]).order("subject")
        if subject:
            query = query.eq("subject", subject)
        result = query.execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
