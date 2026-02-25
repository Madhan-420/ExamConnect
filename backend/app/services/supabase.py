import os
import socket
import tempfile
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

# Avoid [Errno 16] Device or resource busy in Vercel Serverless
# by changing the working directory to /tmp where .gotrue.json can be written.
try:
    os.chdir(tempfile.gettempdir())
except Exception:
    pass

# Removed late monkey patch, managed in api/index.py

# Lazy loaded clients to prevent AWS Lambda freeze/thaw EBUSY TCP socket errors 
_supabase_client: Client = None
_supabase_admin_client: Client = None

def get_supabase() -> Client:
    """Get the regular Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client

def get_supabase_admin() -> Client:
    """Get the admin Supabase client (bypasses RLS)."""
    global _supabase_admin_client
    if _supabase_admin_client is None:
        if not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_SERVICE_KEY must be set for admin operations")
        _supabase_admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_admin_client
