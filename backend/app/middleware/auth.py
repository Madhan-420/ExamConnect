"""
Authentication Middleware
JWT verification and role-based access control via Supabase
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase import get_supabase, get_supabase_admin
import json

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify the JWT token from the Authorization header.
    Returns the user profile from the profiles table.
    """
    token = credentials.credentials

    try:
        sb = get_supabase()
        # Verify token with Supabase Auth
        user_response = sb.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )

        user_id = user_response.user.id

        # Fetch profile from profiles table
        sb_admin = get_supabase_admin()
        profile = sb_admin.table("profiles").select("*").eq("id", user_id).single().execute()

        if not profile.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )

        return profile.data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


def require_role(*roles: str):
    """
    Dependency factory that restricts access to users with specific roles.
    Usage: Depends(require_role("admin", "teacher"))
    """
    async def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(roles)}"
            )
        return current_user
    return role_checker
