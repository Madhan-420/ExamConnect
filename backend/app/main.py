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


# Import routers
from app.routers import admin, teachers, students, auth

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(teachers.router, prefix="/api/teacher", tags=["Teachers"])
app.include_router(students.router, prefix="/api/student", tags=["Students"])


@app.get("/")
async def root():
    return {
        "app": "Exam Connect API",
        "version": "1.0.0",
        "college": "MNSK College of Engineering",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
