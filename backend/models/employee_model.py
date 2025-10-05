from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class EmployeeBase(BaseModel):
    """Base schema for an employee."""
    name: str = Field(..., min_length=2, max_length=100, example="Jane Doe")
    email: EmailStr = Field(..., example="jane.doe@example.com")
    phone_number: str = Field(..., max_length=20, example="+919123456789")
    role: str = Field(..., max_length=50, example="Sales Agent")
    branch_id: Optional[int] = Field(None, description="The ID of the branch the employee belongs to.", example=1)

class EmployeeCreate(EmployeeBase):
    """Schema for creating a new employee."""
    pass

class EmployeeUpdate(BaseModel):
    """Schema for updating an existing employee. All fields are optional."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = Field(None, max_length=20)
    role: Optional[str] = Field(None, max_length=50)
    branch_id: Optional[int] = None

class Employee(EmployeeBase):
    """Schema for representing an employee record from the database."""
    employee_id: int = Field(..., example=101)

    class Config:
        from_attributes = True