# services/employee_service.py
import logging
import time
from typing import Any, Dict, List, Optional
from backend.models.employee_model import EmployeeCreate, EmployeeOut, ValidationRequest, EmployeeUpdate, ValidationResponse
from fastapi import HTTPException, status 


logger = logging.getLogger("employee_service")

class DatabaseError(Exception):

    pass

class ValidationError(Exception):
    def __init__(self, detail: str, code: int = status.HTTP_400_BAD_REQUEST):
        self.detail = detail
        self.code = code
        super().__init__(detail)

class EmployeeService:
    def __init__(self, client: Any, table_name: str = "employee"):
        self.client = client
        self.table_name = table_name

    def _select_employee(self, user_id: str) -> Dict[str, Any]:
        resp = (
            self.client
            .table(self.table_name)
            .select("id, email, name, phone_number, branch_id, role")
            .eq("id", user_id)
            .limit(1)
            .single()
            .execute()
        )
        return getattr(resp, "data", {}) or {}

    def _branch_exists(self, branch_id: int) -> bool:
        resp = (
            self.client
            .table("branch")
            .select("branch_id")
            .eq("branch_id", branch_id)
            .limit(1)
            .execute()
        )
        rows = getattr(resp, "data", []) or []
        return len(rows) == 1
    
    
    def list_employees(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        resp = (
            self.client
            .table(self.table_name)
            .select("id, name, email, phone_number, branch_id, role")
            .limit(limit)
            .offset(offset)
            .execute()
        )
        return getattr(resp, "data", []) or []

    def get_employee_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        resp = (
            self.client
            .table(self.table_name)
            .select("id, name, email, phone_number, branch_id, role")
            .eq("email", email)
            .limit(1)
            .single()
            .execute()
        )
        return getattr(resp, "data", None)

    def create_employee_with_role(self, payload: EmployeeCreate) -> EmployeeOut:
        # 1) Create identity in Supabase Auth
        
        if payload.branch_id is not None and not self._branch_exists(payload.branch_id): 
            raise ValidationError("Branch not found.")
        try:
            signup = self.client.auth.sign_up({"email": str(payload.email), "password": payload.password})
        except Exception as e:
            msg = str(e).lower()
            if "user already exists" in msg or "already registered" in msg:
                raise ValidationError("Email already in use.")  # clear feedback for tests/docs
            if "weak password" in msg or "password" in msg:
                raise ValidationError("Password does not meet strength requirements.")
            logger.exception("Auth sign-up failed")
            raise DatabaseError("Authentication error.")
        user = getattr(signup, "user", None)
        if not user:
            raise DatabaseError("User not created.")

        # 3) Update the trigger-created employee row with business fields
        update_fields: Dict[str, Any] = {
            "email": str(payload.email),
            "role": payload.role,
        }
        if payload.name is not None:
            update_fields["name"] = payload.name
        if payload.phone_number is not None:
            update_fields["phone_number"] = payload.phone_number
        if payload.branch_id is not None:
            update_fields["branch_id"] = payload.branch_id

        # The trigger insert can be slightly delayed; attempt a short retry window
        last_err = None
        for _ in range(6):  # ~1.5s total
            try:
                self.client.table(self.table_name).update(update_fields).eq("id", user.id).execute()
                row = self._select_employee(user.id)
                if row:
                    return EmployeeOut(**row)
            except Exception as e:
                last_err = e
                msg = str(e).lower()
                if "foreign key" in msg or "violates foreign key" in msg:
                    raise ValidationError("Invalid branch_id (foreign key).")
                if "duplicate key" in msg or "unique constraint" in msg:
                    raise ValidationError("Email or phone already in use.")
            time.sleep(0.25)

        logger.exception("Employee update/select failed: %s", last_err)
        raise DatabaseError("Employee record not found after creation.")

    def validate_credentials(self, payload: ValidationRequest) -> ValidationResponse:
        try:
            signin = self.client.auth.sign_in_with_password({
                "email": str(payload.email),
                "password": payload.password
            })
        except Exception as e:
            msg = str(e).lower()
            if "email not confirmed" in msg or "email_not_confirmed" in msg:
                return ValidationResponse(exists=False, reason="Email not confirmed.", is_admin=False)  # precise mapping [web:2][web:9]
            logger.exception("Auth sign-in failed")
            return ValidationResponse(exists=False, reason="Service unavailable.", is_admin=False)  # generic fallback [web:9]

        user = getattr(signin, "user", None)
        if not user:
            return ValidationResponse(exists=False, reason="Invalid email or password.", is_admin=False)  # generic auth failure [web:9]

        row = self._select_employee(user.id) 
        role = (row or {}).get("role") or "unassigned"
        is_admin = role.lower() == "admin"
        return ValidationResponse(exists=True, reason="Valid email and password.", is_admin=is_admin)
    
    def update_employee(self, user_id: str, payload: EmployeeUpdate) -> EmployeeOut:
    # 1) Update identity via Auth (admin context when changing other users)
        auth_updates: Dict[str, Any] = {}
        if payload.email is not None:
            auth_updates["email"] = str(payload.email)
        if payload.password is not None:
            auth_updates["password"] = payload.password
    
        if auth_updates:
            try:
                # Use admin API when updating arbitrary users by id (requires service role)
                self.client.auth.admin.update_user_by_id(user_id, auth_updates)
            except Exception as e:
                msg = str(e).lower()
                if "email not confirmed" in msg or "email_change_needs_verification" in msg:
                    raise DatabaseError("Email change requires confirmation.") from e
                if "already registered" in msg or "user_already_exists" in msg:
                    raise DatabaseError("Email already in use.") from e
                raise DatabaseError("Auth update failed.") from e  # admin update failure
    
        # 2) Update business fields in employee
        update_fields: Dict[str, Any] = {}
        if payload.email is not None:
            update_fields["email"] = str(payload.email)
        if payload.name is not None:
            update_fields["name"] = payload.name
        if payload.phone_number is not None:
            update_fields["phone_number"] = payload.phone_number
        if payload.branch_id is not None:
            update_fields["branch_id"] = payload.branch_id
        if payload.role is not None:
            update_fields["role"] = payload.role
    
        if update_fields:
            try:
                self.client.table(self.table_name).update(update_fields).eq("id", user_id).execute()
            except Exception as e:
                msg = str(e).lower()
                # Surface uniqueness violations clearly
                if "duplicate key value" in msg or "unique constraint" in msg:
                    raise DatabaseError("Email or phone already in use.") from e
                raise DatabaseError("Employee update failed.") from e
    
        # 3) Return fresh view with a minimal projection
        row = self._select_employee(user_id)
        if not row:
            raise DatabaseError("Employee not found")
        return EmployeeOut(**row)


    # def delete_employee(self, user_id: str, cascade_auth: bool = True) -> bool:
    #     if cascade_auth:
    #         # Preferred: delete identity so FK ON DELETE CASCADE removes employee row
    #         try:
    #             self.client.auth.admin.delete_user(user_id)
    #             return True
    #         except Exception as e:
    #             msg = str(e).lower()
    #             # Treat not-found as idempotent success
    #             if "not found" in msg or "no user" in msg:
    #                 return True
    #             raise DatabaseError("Auth delete failed.") from e

    #     # Optional branch: only remove employee row (identity remains)
    #     try:
    #         self.client.table(self.table_name).delete().eq("id", user_id).execute()
    #         return True
    #     except Exception as e:
    #         raise DatabaseError("Employee delete failed.") from e
