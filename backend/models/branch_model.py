from pydantic import BaseModel, Field
from typing import Optional

class BranchBase(BaseModel):
    """Base schema for a branch."""
    Address: str = Field(..., max_length=255, description="The full Address of the branch.", example="456 Park Avenue, Metropolis")
    
    # Assuming 'Admin (Agent)' is a foreign key to the Employee table
    Admin_ID: Optional[int] = Field(None, description="The ID of the employee managing this branch.", example=102)

class BranchCreate(BranchBase):
    """Schema for creating a new branch."""
    pass

class BranchUpdate(BaseModel):
    """Schema for updating an existing branch. All fields are optional."""
    Address: Optional[str] = Field(None, max_length=255)
    Admin_ID: Optional[int] = Field(None)

class Branch(BranchBase):
    """Schema for representing a branch record from the database."""
    Branch_ID: int = Field(..., description="Primary key for the branch.", example=1)

    class Config:
        from_attributes = True