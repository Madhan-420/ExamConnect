"""
Authentication Router
Handles user registration, login, and profile retrieval
"""

from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import UserRegister, UserLogin, UserResponse
from app.services.supabase import get_supabase, get_supabase_admin, reset_clients
from app.middleware.auth import get_current_user
import errno

router = APIRouter()


def _is_ebusy(exc: Exception) -> bool:
    """Check if an exception (or its cause chain) is EBUSY."""
    # Direct OSError check
    if isinstance(exc, OSError) and exc.errno == errno.EBUSY:
        return True
    # httpx/httpcore wrap OSError - check the string
    if "Device or resource busy" in str(exc):
        return True
    # Walk the cause chain
    cause = getattr(exc, "__cause__", None) or getattr(exc, "__context__", None)
    if cause and cause is not exc:
        return _is_ebusy(cause)
    return False


@router.post("/register", response_model=dict)
def register(user: UserRegister):
    """Register a new user via Supabase Auth and create a profile."""
    last_error = None
    for attempt in range(2):
        try:
            sb_admin = get_supabase_admin()

            # Create user in Supabase Auth
            auth_response = sb_admin.auth.admin.create_user({
                "email": user.email,
                "password": user.password,
                "email_confirm": True
            })

            if not auth_response or not auth_response.user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user account"
                )

            user_id = auth_response.user.id

            # Create profile in profiles table
            profile_data = {
                "id": user_id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value,
                "gender": user.gender.value,
                "department": user.department,
                "reg_number": user.reg_number,
            }

            sb_admin.table("profiles").insert(profile_data).execute()

            return {
                "message": "Registration successful",
                "user": {
                    "id": user_id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role.value
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            last_error = e
            if _is_ebusy(e) and attempt == 0:
                reset_clients()
                continue
            import traceback
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
            )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Registration failed after retry: {str(last_error)}"
    )


@router.post("/login", response_model=dict)
def login(credentials: UserLogin):
    """Login user and return access token."""
    last_error = None
    for attempt in range(2):
        try:
            sb = get_supabase()

            # Sign in with Supabase Auth
            auth_response = sb.auth.sign_in_with_password({
                "email": credentials.email,
                "password": credentials.password
            })

            if not auth_response or not auth_response.session:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

            user_id = auth_response.user.id
            token = auth_response.session.access_token

            # Fetch profile
            sb_admin = get_supabase_admin()
            profile = sb_admin.table("profiles").select("*").eq("id", user_id).single().execute()

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": profile.data if profile.data else {
                    "id": user_id,
                    "email": credentials.email
                }
            }

        except HTTPException:
            raise
        except Exception as e:
            last_error = e
            # If EBUSY and first attempt, reset clients and retry
            if _is_ebusy(e) and attempt == 0:
                reset_clients()
                continue
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Login failed: {str(e)}"
            )

    # Should not reach here, but just in case
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Login failed after retry: {str(last_error)}"
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return current_user
