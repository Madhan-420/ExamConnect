"""
Live Classes Router
Handles live class CRUD - bypasses RLS using service role key
"""

from fastapi import APIRouter, HTTPException, Depends
from app.services.supabase import get_supabase_admin
from app.middleware.auth import get_current_user, require_role
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class StartClassRequest(BaseModel):
    title: str
    room_id: str


class EndClassRequest(BaseModel):
    class_id: str


@router.get("/active")
def get_active_classes(current_user: dict = Depends(get_current_user)):
    """Get all currently active live classes."""
    try:
        sb = get_supabase_admin()
        query = sb.table("live_classes") \
            .select("*, profiles(full_name)") \
            .eq("is_active", True) \
            .order("created_at", desc=False)
            
        role = current_user.get("role")
        
        if role == "student":
            student = sb.table("profiles").select("mentor_id").eq("id", current_user["id"]).single().execute()
            mentor_id = student.data.get("mentor_id") if student.data else None
            if mentor_id:
                query = query.eq("teacher_id", mentor_id)
            else:
                return []
        elif role == "teacher":
            query = query.eq("teacher_id", current_user["id"])

        result = query.execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start")
def start_class(body: StartClassRequest, current_user: dict = Depends(require_role("teacher"))):
    """Start a new live class (teachers only)."""
    try:
        sb = get_supabase_admin()
        result = sb.table("live_classes").insert({
            "teacher_id": current_user["id"],
            "title": body.title,
            "room_id": body.room_id,
            "is_active": True,
        }).execute()
        return result.data[0] if result.data else {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/end/{class_id}")
def end_class(class_id: str, current_user: dict = Depends(require_role("teacher"))):
    """End an active live class (teacher only, must own it)."""
    try:
        from datetime import datetime, timezone
        sb = get_supabase_admin()
        sb.table("live_classes") \
            .update({"is_active": False, "ended_at": datetime.now(timezone.utc).isoformat()}) \
            .eq("id", class_id) \
            .eq("teacher_id", current_user["id"]) \
            .execute()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
