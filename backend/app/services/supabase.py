import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# IPv4-only DNS is handled globally in api/index.py (the Vercel entry point).
# No hardcoded IP overrides needed here – the universal IPv4 filter is safer.
# ---------------------------------------------------------------------------

from supabase import create_client, Client

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

# ---------------------------------------------------------------------------
# Lazy-loaded clients with reset capability for Lambda freeze/thaw recovery
# ---------------------------------------------------------------------------
_supabase_client: Client = None
_supabase_admin_client: Client = None


def reset_clients():
    """Reset all cached clients so next call creates fresh connections."""
    global _supabase_client, _supabase_admin_client
    _supabase_client = None
    _supabase_admin_client = None


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
