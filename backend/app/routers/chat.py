"""
Chat Router
Handles group chat messages - bypasses RLS using service role key
"""

from fastapi import APIRouter, HTTPException, Depends
from app.services.supabase import get_supabase_admin
from app.middleware.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class SendMessageRequest(BaseModel):
    content: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None


@router.get("/messages")
def get_messages(current_user: dict = Depends(get_current_user)):
    """Fetch the latest 100 group chat messages with sender profiles."""
    try:
        sb = get_supabase_admin()
        result = sb.table("group_messages") \
            .select("*, profiles(full_name, role)") \
            .order("created_at", desc=False) \
            .limit(100) \
            .execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages/since")
def get_messages_since(since: str, current_user: dict = Depends(get_current_user)):
    """Fetch messages created after a given ISO timestamp (for polling)."""
    try:
        sb = get_supabase_admin()
        result = sb.table("group_messages") \
            .select("*, profiles(full_name, role)") \
            .gt("created_at", since) \
            .order("created_at", desc=False) \
            .execute()
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages")
def send_message(body: SendMessageRequest, current_user: dict = Depends(get_current_user)):
    """Insert a new group chat message. Uses service role to bypass RLS."""
    try:
        sb = get_supabase_admin()
        row = {
            "sender_id": current_user["id"],
            "content": body.content,
        }
        if body.file_url:
            row["file_url"] = body.file_url
        if body.file_name:
            row["file_name"] = body.file_name

        result = sb.table("group_messages").insert(row).execute()
        return result.data[0] if result.data else {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
