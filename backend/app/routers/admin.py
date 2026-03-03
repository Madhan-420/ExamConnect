"""
Admin Router
Dashboard stats, user management (CRUD), system oversight
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models.schemas import UserRegister, UserResponse, UserUpdate, AdminDashboard, FeedbackResponse
from app.services.supabase import get_supabase_admin
from app.middleware.auth import require_role
from typing import Optional

router = APIRouter()


@router.get("/dashboard", response_model=AdminDashboard)
async def admin_dashboard(current_user: dict = Depends(require_role("admin"))):
    """Get admin dashboard statistics."""
    try:
        sb = get_supabase_admin()

        # Count users by role
        all_users = sb.table("profiles").select("role").execute()
        users = all_users.data or []
        total_teachers = sum(1 for u in users if u["role"] == "teacher")
        total_students = sum(1 for u in users if u["role"] == "student")

        # Count exams
        exams = sb.table("exams").select("id", count="exact").execute()
        total_exams = exams.count or 0

        # Count submissions
        submissions = sb.table("submissions").select("id", count="exact").execute()
        total_submissions = submissions.count or 0

        # Recent exams
        recent = sb.table("exams").select("*").order("created_at", desc=True).limit(5).execute()

        return AdminDashboard(
            total_users=len(users),
            total_teachers=total_teachers,
            total_students=total_students,
            total_exams=total_exams,
            total_submissions=total_submissions,
            recent_exams=recent.data or []
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard: {str(e)}")


@router.get("/users", response_model=list)
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role"),
    current_user: dict = Depends(require_role("admin"))
):
    """List all users, optionally filtered by role."""
    try:
        sb = get_supabase_admin()
        query = sb.table("profiles").select("*").order("created_at", desc=True)

        if role:
            query = query.eq("role", role)

        result = query.execute()
        return result.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.post("/users", response_model=dict)
async def create_user(
    user: UserRegister,
    current_user: dict = Depends(require_role("admin"))
):
    """Admin creates a new user (teacher or student)."""
    try:
        sb = get_supabase_admin()

        # Create in Supabase Auth
        auth_response = sb.auth.admin.create_user({
            "email": user.email,
            "password": user.password,
            "email_confirm": True
        })

        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")

        user_id = auth_response.user.id

        # Create profile
        profile_data = {
            "id": user_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "department": user.department,
            "reg_number": user.reg_number,
        }

        sb.table("profiles").insert(profile_data).execute()

        return {"message": "User created successfully", "user_id": user_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create user: {str(e)}")


@router.put("/users/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    update: UserUpdate,
    current_user: dict = Depends(require_role("admin"))
):
    """Update a user's profile (role, name, department, mentor_id, etc.)."""
    try:
        sb = get_supabase_admin()

        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        if "role" in update_data:
            update_data["role"] = update_data["role"].value if hasattr(update_data["role"], "value") else update_data["role"]

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        # Automatically handled by dict dumping: if mentor_id is not None, it updates it.

        result = sb.table("profiles").update(update_data).eq("id", user_id).execute()

        return {"message": "User updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update user: {str(e)}")


@router.put("/users/{user_id}/mentor", response_model=dict)
async def assign_mentor(
    user_id: str,
    mentor_id: str = Query(..., description="ID of the teacher to assign as mentor"),
    current_user: dict = Depends(require_role("admin"))
):
    """Assign a teacher as a mentor to a student."""
    try:
        sb = get_supabase_admin()

        # Check if mentor is a teacher
        mentor = sb.table("profiles").select("role").eq("id", mentor_id).single().execute()
        if not mentor.data or mentor.data["role"] != "teacher":
            raise HTTPException(status_code=400, detail="Mentor must be a teacher")

        # Update profile
        sb.table("profiles").update({"mentor_id": mentor_id}).eq("id", user_id).execute()

        return {"message": "Mentor assigned successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to assign mentor: {str(e)}")



@router.delete("/users/{user_id}", response_model=dict)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_role("admin"))
):
    """Delete a user from both Auth and profiles."""
    try:
        sb = get_supabase_admin()

        # Prevent self-deletion
        if user_id == current_user["id"]:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")

        # Delete profile first
        sb.table("profiles").delete().eq("id", user_id).execute()

        # Delete from Supabase Auth
        sb.auth.admin.delete_user(user_id)

        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete user: {str(e)}")


# ─── Admin Analytics ───

@router.get("/feedbacks", response_model=list)
async def view_feedbacks(current_user: dict = Depends(require_role("admin"))):
    """View all feedbacks/complaints."""
    try:
        sb = get_supabase_admin()
        
        feedbacks = sb.table("feedbacks").select("*").order("created_at", desc=True).execute()
        fb_list = feedbacks.data or []
        
        for fb in fb_list:
            user = sb.table("profiles").select("full_name").eq("id", fb["user_id"]).single().execute()
            fb["user_name"] = user.data.get("full_name", "Unknown") if user.data else "Unknown"

        return fb_list

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Admin Analytics ───

import json as _json

@router.get("/analytics/students", response_model=list)
async def student_performance(current_user: dict = Depends(require_role("admin"))):
    """All students with their results, grades, and average performance."""
    try:
        sb = get_supabase_admin()
        students = sb.table("profiles").select("*").eq("role", "student").order("full_name").execute()
        student_list = students.data or []
        for s in student_list:
            subs = sb.table("submissions").select("id, exam_id, submitted_at, status").eq("student_id", s["id"]).execute()
            s["total_submissions"] = len(subs.data or [])
            results = sb.table("results").select("marks_obtained, total_marks, percentage, grade, exam_id").eq("student_id", s["id"]).execute()
            res_list = results.data or []
            s["results"] = res_list
            s["total_results"] = len(res_list)
            percs = [r["percentage"] for r in res_list if r.get("percentage") is not None]
            s["average_percentage"] = round(sum(percs) / len(percs), 1) if percs else None
            grades = [r.get("grade") for r in res_list if r.get("grade")]
            s["grades"] = grades
        return student_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/teachers", response_model=list)
async def teacher_activity(current_user: dict = Depends(require_role("admin"))):
    """All teachers with their exam counts, submission counts, and activity."""
    try:
        sb = get_supabase_admin()
        teachers = sb.table("profiles").select("*").eq("role", "teacher").order("full_name").execute()
        teacher_list = teachers.data or []
        for t in teacher_list:
            exams = sb.table("exams").select("id, title, subject, status, created_at").eq("teacher_id", t["id"]).order("created_at", desc=True).execute()
            exam_list = exams.data or []
            t["exams"] = exam_list
            t["total_exams"] = len(exam_list)
            exam_ids = [e["id"] for e in exam_list]
            total_subs = 0
            evaluated = 0
            for eid in exam_ids:
                subs = sb.table("submissions").select("id, status").eq("exam_id", eid).execute()
                sub_list = subs.data or []
                total_subs += len(sub_list)
                evaluated += sum(1 for s in sub_list if s["status"] == "evaluated")
            t["total_submissions_received"] = total_subs
            t["evaluated_count"] = evaluated
        return teacher_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/submissions")
async def all_submissions_report(current_user: dict = Depends(require_role("admin"))):
    """Download all submissions across all exams as JSON."""
    try:
        sb = get_supabase_admin()
        subs = sb.table("submissions").select("*").order("submitted_at", desc=True).execute()
        submissions = subs.data or []
        for sub in submissions:
            student = sb.table("profiles").select("full_name, email, reg_number").eq("id", sub["student_id"]).single().execute()
            sub["student"] = student.data or {}
            exam = sb.table("exams").select("title, subject").eq("id", sub["exam_id"]).single().execute()
            sub["exam"] = exam.data or {}
            result = sb.table("results").select("marks_obtained, total_marks, percentage, grade").eq("submission_id", sub["id"]).execute()
            sub["result"] = result.data[0] if result.data else None
        content = _json.dumps(submissions, indent=2, default=str)
        from fastapi.responses import Response
        return Response(content=content, media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=all_submissions.json"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exams", response_model=list)
async def admin_list_exams(current_user: dict = Depends(require_role("admin"))):
    """All exams with teacher info and submission counts."""
    try:
        sb = get_supabase_admin()
        exams = sb.table("exams").select("*").order("created_at", desc=True).execute()
        exam_list = exams.data or []
        for e in exam_list:
            teacher = sb.table("profiles").select("full_name").eq("id", e["teacher_id"]).single().execute()
            e["teacher_name"] = teacher.data.get("full_name", "Unknown") if teacher.data else "Unknown"
            subs = sb.table("submissions").select("id", count="exact").eq("exam_id", e["id"]).execute()
            e["submission_count"] = subs.count or 0
        return exam_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/exams/{exam_id}/detail", response_model=dict)
async def admin_exam_detail(exam_id: str, current_user: dict = Depends(require_role("admin"))):
    """Admin view: full exam with questions and all submissions."""
    try:
        sb = get_supabase_admin()
        exam = sb.table("exams").select("*").eq("id", exam_id).single().execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        questions = sb.table("questions").select("*").eq("exam_id", exam_id).order("order_num").execute()
        subs = sb.table("submissions").select("*").eq("exam_id", exam_id).order("submitted_at", desc=True).execute()
        submissions = subs.data or []
        for sub in submissions:
            student = sb.table("profiles").select("full_name, email, reg_number").eq("id", sub["student_id"]).single().execute()
            sub["student"] = student.data or {}
            result = sb.table("results").select("*").eq("submission_id", sub["id"]).execute()
            sub["result"] = result.data[0] if result.data else None
        data = exam.data
        data["questions"] = questions.data or []
        data["submissions"] = submissions
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

