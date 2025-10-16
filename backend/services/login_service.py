from backend.config.supabase_client import supabase

TABLE_NAME = "users"


def validate_user_credentials(email: str, password: str):
    """
    Checks if a user with the given email and password exists in Supabase.
    NOTE: Replace plain password comparison with hashing in production.
    """
    response = supabase.table(TABLE_NAME).select("*").eq("email", email).eq("password", password).limit(1).execute()

    data = response.get("data") if isinstance(response, dict) else getattr(response, "data", None)
    if data and len(data) > 0:
        return True, "Valid email and password."
    return False, "Invalid email or password."
