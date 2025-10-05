from pydantic import BaseModel, Field
from typing import Optional

class ScriptBase(BaseModel):
    """Base schema for a script."""
    branch_id: int = Field(..., description="Foreign key for the branch this script belongs to.", example=1)
    call_trigger_event: str = Field(..., max_length=100, description="The event that triggers this script.", example="new_lead_follow_up")
    instructions: str = Field(..., description="The main instructional text for the agent.")
    safeguards: str = Field(..., description="Safeguards or compliance notes for the agent.")

class ScriptCreate(ScriptBase):
    """Schema for creating a new script."""
    pass

class ScriptUpdate(BaseModel):
    """Schema for updating an existing script. All fields are optional."""
    branch_id: Optional[int] = None
    call_trigger_event: Optional[str] = Field(None, max_length=100)
    instructions: Optional[str] = None
    safeguards: Optional[str] = None

class Script(ScriptBase):
    """Schema for representing a script record from the database."""
    script_id: int = Field(..., description="Primary key for the script.", example=1)

    class Config:
        from_attributes = True