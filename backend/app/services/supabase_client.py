"""Supabase client — initialized from environment variables.

Configure SUPABASE_URL and SUPABASE_KEY in backend/.env before using auth features.
"""

from app.config import SUPABASE_URL, SUPABASE_KEY

_client = None


def get_supabase():
    """Lazy-initialize and return the Supabase client."""
    global _client
    if _client is None:
        if not SUPABASE_URL or SUPABASE_URL == "your-supabase-url":
            raise RuntimeError(
                "Supabase is not configured. "
                "Set SUPABASE_URL and SUPABASE_KEY in backend/.env"
            )
        from supabase import create_client
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client
