"""
Exam Connect Backend - FastAPI Application
MNSK College of Engineering
Created by: Neelakandan M
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="Exam Connect API",
    description="Online Exam Management System for MNSK College of Engineering",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - allow all origins in production for now
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
origins = [o.strip().rstrip("/") for o in origins]  # Clean up trailing slashes

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins to fix Vercel CORS issues
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Explicit OPTIONS handler for all routes (catches preflight before middleware issues)
@app.options("/{path:path}")
async def options_handler(request: Request, path: str):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "86400",
        }
    )


from app.routers import admin, teachers, students, auth
from app.services.supabase import get_supabase_admin
import asyncio
from datetime import datetime, timedelta, timezone

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(teachers.router, prefix="/api/teacher", tags=["Teachers"])
app.include_router(students.router, prefix="/api/student", tags=["Students"])

async def delete_old_submissions():
    """Background task to delete PDF submissions older than 24 hours."""
    while True:
        try:
            sb = get_supabase_admin()
            # Calculate 24 hours ago
            cutoff_date = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
            
            # Find old submissions with files
            old_subs = sb.table("submissions").select("id, file_url").lt("submitted_at", cutoff_date).not_.is_("file_url", "null").execute()
            
            for sub in (old_subs.data or []):
                file_url = sub.get("file_url")
                if file_url:
                    # Extract file path from URL (assuming format: .../storage/v1/object/public/answers/path/to/file.pdf)
                    try:
                        file_path = file_url.split("/answers/")[-1]
                        # Remove from storage
                        sb.storage.from_("answers").remove([file_path])
                    except Exception as e:
                        print(f"Failed to delete file {file_url}: {e}")
                    
                    # Update DB record to remove file_url (or delete the record entirely based on rules, here we just remove the file payload to keep the submission record)
                    sb.table("submissions").update({"file_url": None, "answers": {"info": "File auto-deleted after 24h"}}).eq("id", sub["id"]).execute()
                    
            print(f"[{datetime.now().isoformat()}] Cleaned up {len(old_subs.data or [])} old submissions.")
        except Exception as e:
            print(f"Error in delete_old_submissions task: {e}")
            
        # Sleep for 1 hour
        await asyncio.sleep(3600)

@app.on_event("startup")
async def startup_event():
    # Start the background task
    asyncio.create_task(delete_old_submissions())


@app.get("/")
async def root():
    return {
        "app": "Exam Connect API",
        "version": "1.0.2",
        "college": "MNSK College of Engineering",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
