"""
Admin Router
Dashboard stats, user management (CRUD), system oversight
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models.schemas import UserRegister, UserResponse, UserUpdate, AdminDashboard
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
    """Update a user's profile (role, name, department, etc.)."""
    try:
        sb = get_supabase_admin()

        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        if "role" in update_data:
            update_data["role"] = update_data["role"].value if hasattr(update_data["role"], "value") else update_data["role"]

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = sb.table("profiles").update(update_data).eq("id", user_id).execute()

        return {"message": "User updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update user: {str(e)}")


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
