import os
from supabase import create_client, Client as SupabaseClient

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise Exception("Supabase URL and Key must be set in the environment variables.")

supabase: SupabaseClient = create_client(url, key)
