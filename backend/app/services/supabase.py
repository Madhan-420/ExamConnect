import os
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

# Regular client (uses anon key, respects RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Admin client (uses service role key, bypasses RLS)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY) if SUPABASE_SERVICE_KEY else None


def get_supabase() -> Client:
    """Get the regular Supabase client."""
    return supabase


def get_supabase_admin() -> Client:
    """Get the admin Supabase client (bypasses RLS)."""
    if not supabase_admin:
        raise ValueError("SUPABASE_SERVICE_KEY must be set for admin operations")
    return supabase_admin
