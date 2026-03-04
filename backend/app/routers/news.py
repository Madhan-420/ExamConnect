"""
News & Announcements Router
Admin can create, update, delete announcements.
All authenticated users can view active announcements.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.middleware.auth import get_current_user
from app.services.supabase import get_supabase_admin

router = APIRouter()


class NewsCreate(BaseModel):
    title: str
    content: str
    priority: str = "normal"  # normal, important, urgent
    is_active: bool = True
    expires_at: Optional[str] = None


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[str] = None


@router.get("/active")
async def get_active_news(user=Depends(get_current_user)):
    """Get all active, non-expired announcements for any authenticated user."""
    sb = get_supabase_admin()
    now = datetime.utcnow().isoformat()

    # Get active news
    result = sb.table("news_announcements") \
        .select("*") \
        .eq("is_active", True) \
        .order("created_at", desc=True) \
        .execute()

    # Filter out expired items client-side (Supabase doesn't support OR with null easily)
    active = []
    for item in (result.data or []):
        expires = item.get("expires_at")
        if expires is None or expires > now:
            active.append(item)

    return active


@router.get("")
async def get_all_news(user=Depends(get_current_user)):
    """Admin only: get all announcements."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    sb = get_supabase_admin()
    result = sb.table("news_announcements") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()

    return result.data or []


@router.post("")
async def create_news(news: NewsCreate, user=Depends(get_current_user)):
    """Admin only: create a new announcement."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    sb = get_supabase_admin()
    data = {
        "title": news.title,
        "content": news.content,
        "priority": news.priority,
        "is_active": news.is_active,
        "created_by": user["id"],
    }
    if news.expires_at:
        data["expires_at"] = news.expires_at

    result = sb.table("news_announcements").insert(data).execute()
    return result.data[0] if result.data else {"message": "Created"}


@router.put("/{news_id}")
async def update_news(news_id: str, news: NewsUpdate, user=Depends(get_current_user)):
    """Admin only: update an announcement."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    sb = get_supabase_admin()
    update_data = {k: v for k, v in news.dict().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = sb.table("news_announcements").update(update_data).eq("id", news_id).execute()
    return result.data[0] if result.data else {"message": "Updated"}


@router.delete("/{news_id}")
async def delete_news(news_id: str, user=Depends(get_current_user)):
    """Admin only: delete an announcement."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    sb = get_supabase_admin()
    sb.table("news_announcements").delete().eq("id", news_id).execute()
    return {"message": "Deleted"}
