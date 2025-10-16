import logging
from typing import Any, Dict, List, Tuple

from backend.config.supabase_client import supabase


logger = logging.getLogger("validation_service")
TABLE_NAME = "users"

class DatabaseError(Exception):
    """Raised when there is a problem communicating with the database (Supabase)."""
    pass


class ValidationService:
    """
    Service responsible for validating user credentials against the Supabase users table.
    Provides clean error handling and small utility helpers.
    """

    def __init__(self, table_name: str = TABLE_NAME, client: Any = supabase):
        self.table_name = table_name
        self.client = client

    def _extract_supabase_data(self, resp: Any) -> List[Dict[str, Any]]:
        """
        Normalize supabase response to Python list of rows.
        Raises DatabaseError on Supabase-reported error or unexpected response shape.
        """
        try:
            if isinstance(resp, dict):
                error = resp.get("error")
                data = resp.get("data")
            else:
                error = getattr(resp, "error", None)
                data = getattr(resp, "data", None)
        except Exception as e:
            logger.exception("Unexpected supabase response structure")
            raise DatabaseError("Unexpected response from database client") from e

        if error:
            logger.error("Supabase error: %s", error)
            raise DatabaseError(f"Database error: {error}")

        # If data is None, return empty list (defensive)
        return data or []

    def _query_user_by_email_and_password(self, email: str, password: str) -> List[Dict[str, Any]]:
        """
        Query supabase for a user matching email AND password.
        Returns list of rows (empty if none).
        """
        try:
            resp = (
                self.client
                .table(self.table_name)
                .select("*")
                .eq("email", email)
                .eq("password", password)
                .limit(1)
                .execute()
            )
            rows = self._extract_supabase_data(resp)
            return rows
        except DatabaseError:
            # re-raise database errors unchanged
            raise
        except Exception as e:
            logger.exception("Unexpected error while querying user")
            raise DatabaseError("Unexpected error querying database") from e

    def validate_credentials(self, email: str, password: str) -> Tuple[bool, str, bool]:
        """
        Validate credentials and return (exists, reason, is_admin).
        - exists: True if a matching user row found
        - reason: explanation string
        - is_admin: boolean, default False if not present
        Raises DatabaseError on DB/communication problems.
        """
        rows = self._query_user_by_email_and_password(email, password)

        if not rows:
            return False, "Invalid email or password.", False

        user = rows[0]
        # Safely obtain is_admin; default False if missing or unusable
        is_admin = False
        try:
            is_admin = bool(user.get("is_admin", False))
        except Exception:
            logger.warning("Couldn't determine is_admin for user record; falling back to False")

        return True, "Valid email and password.", is_admin
