import os
from supabase import create_client, Client as SupabaseClient
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv(r"backend/config/keys.env")

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Check if the environment variables are set
if not url or not key:
    raise Exception("Supabase URL and Key must be set in the environment variables.")

# Initialize the client once and export the instance
supabase: SupabaseClient = create_client(url, key)
