"""
Exam Connect Backend - FastAPI Application
MNSK College of Engineering
Created by: Neelakandan M
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
