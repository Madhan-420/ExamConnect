"""
Supabase Client Configuration
"""

import os
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from dotenv import load_dotenv

class MemoryStorage:
    def __init__(self):
        self.storage = {}
    def get_item(self, key: str) -> str | None:
        return self.storage.get(key)
    def set_item(self, key: str, value: str) -> None:
        self.storage[key] = value
    def remove_item(self, key: str) -> None:
        self.storage.pop(key, None)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

# Use memory storage to avoid [Errno 16] Device or resource busy in Vercel Serveless
opts = ClientOptions(storage=MemoryStorage())

# Regular client (uses anon key, respects RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=opts)

# Admin client (uses service role key, bypasses RLS)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY, options=opts) if SUPABASE_SERVICE_KEY else None


def get_supabase() -> Client:
    """Get the regular Supabase client."""
    return supabase


def get_supabase_admin() -> Client:
    """Get the admin Supabase client (bypasses RLS)."""
    if not supabase_admin:
        raise ValueError("SUPABASE_SERVICE_KEY must be set for admin operations")
    return supabase_admin
