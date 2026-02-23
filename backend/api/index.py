"""
Vercel Serverless Entry Point
"""
import sys
import os
import traceback

# Add the backend root to path so 'app' package can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.main import app
except Exception as e:
    # If the main app fails to import, create a minimal app to show the error
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()

    error_detail = {
        "error": str(e),
        "traceback": traceback.format_exc(),
        "python_version": sys.version,
        "env_vars_set": {
            "SUPABASE_URL": bool(os.getenv("SUPABASE_URL")),
            "SUPABASE_KEY": bool(os.getenv("SUPABASE_KEY")),
            "SUPABASE_SERVICE_KEY": bool(os.getenv("SUPABASE_SERVICE_KEY")),
            "JWT_SECRET": bool(os.getenv("JWT_SECRET")),
            "CORS_ORIGINS": bool(os.getenv("CORS_ORIGINS")),
        }
    }

    @app.get("/{path:path}")
    async def catch_all(path: str):
        return JSONResponse(status_code=500, content=error_detail)
