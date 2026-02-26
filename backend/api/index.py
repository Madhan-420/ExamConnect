"""
Vercel Serverless Entry Point
"""
import sys
import os
import traceback
import socket

# ===========================================================================
# CRITICAL FIX for Vercel/AWS Lambda:
# Lambda's Firecracker microVMs do NOT support IPv6 sockets at all.
# Any attempt to create an AF_INET6 socket raises [Errno 16] EBUSY.
#
# Fix 1: Filter getaddrinfo to only return IPv4 results.
# Fix 2: Patch socket() constructor to force AF_INET if AF_INET6 is requested.
# Both must happen BEFORE any library imports (httpx, httpcore, etc.)
# ===========================================================================

# --- Fix 1: getaddrinfo IPv4-only filter ---
_real_getaddrinfo = socket.getaddrinfo

def _ipv4_getaddrinfo(*args, **kwargs):
    responses = _real_getaddrinfo(*args, **kwargs)
    ipv4 = [r for r in responses if r[0] == socket.AF_INET]
    return ipv4 if ipv4 else responses  # Fallback to all if no IPv4 found

socket.getaddrinfo = _ipv4_getaddrinfo

# --- Fix 2: Block IPv6 socket creation entirely ---
_real_socket = socket.socket

class _IPv4OnlySocket(_real_socket):
    def __init__(self, family=socket.AF_INET, type=socket.SOCK_STREAM, proto=0, fileno=None):
        # Force any IPv6 request to IPv4
        if family == socket.AF_INET6:
            family = socket.AF_INET
        super().__init__(family, type, proto, fileno)

socket.socket = _IPv4OnlySocket
# ===========================================================================

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
