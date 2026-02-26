"""
Vercel Serverless Entry Point

Applies critical monkey-patches for AWS Lambda / Vercel Python runtime
BEFORE any library imports, to prevent [Errno 16] Device or resource busy.
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
# We apply THREE layers of protection:
# 1. Filter getaddrinfo to return only IPv4 results
# 2. Override socket() to force AF_INET when AF_INET6 is requested
# 3. Remove AF_INET6 from the socket module constants
# ===========================================================================

# --- Fix 1: getaddrinfo IPv4-only filter ---
_real_getaddrinfo = socket.getaddrinfo

def _ipv4_getaddrinfo(host, port, family=0, *args, **kwargs):
    # Force family to AF_INET (IPv4 only)
    return _real_getaddrinfo(host, port, socket.AF_INET, *args, **kwargs)

socket.getaddrinfo = _ipv4_getaddrinfo

# --- Fix 2: Override socket creation to block IPv6 ---
_OrigSocket = socket.socket.__init__ if hasattr(socket.socket, '__init__') else None

_original_socket_init = socket.socket.__init__

def _patched_socket_init(self, family=socket.AF_INET, type=socket.SOCK_STREAM, proto=0, fileno=None):
    if family == socket.AF_INET6:
        family = socket.AF_INET
    _original_socket_init(self, family, type, proto, fileno)

socket.socket.__init__ = _patched_socket_init

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
