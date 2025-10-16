# models/employee_models.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    phone_number: Optional[str] = None
    branch_id: Optional[int] = None
    role: str = "unassigned"

class EmployeeUpdate(BaseModel):
    # Identity fields (handled via Auth if present)
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    # Business fields (handled via employee table)
    name: Optional[str] = None
    phone_number: Optional[str] = None
    branch_id: Optional[int] = None
    role: Optional[str] = None

class EmployeeOut(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    phone_number: Optional[str] = None
    branch_id: Optional[int] = None
    role: str

class ValidationRequest(BaseModel):
    email: EmailStr
    password: str

class ValidationResponse(BaseModel):
    exists: bool
    reason: str
    is_admin: bool
