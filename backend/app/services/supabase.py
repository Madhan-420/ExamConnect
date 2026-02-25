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

# Extremely critical fix for Vercel/AWS Lambda Python:
# httpx will attempt to use IPv6 if DNS returns it, but AWS Lambda Firecracker microVMs 
# throw '[Errno 16] Device or resource busy' when attempting to open an IPv6 socket. 
# We monkey-patch socket.getaddrinfo to force IPv4 resolution ONLY.
_patched = False
if not _patched:
    old_getaddrinfo = socket.getaddrinfo
    def new_getaddrinfo(*args, **kwargs):
        responses = old_getaddrinfo(*args, **kwargs)
        return [r for r in responses if r[0] == socket.AF_INET]
    socket.getaddrinfo = new_getaddrinfo
    _patched = True

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
