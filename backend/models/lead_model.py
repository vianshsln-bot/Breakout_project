
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

# --- Enums for Lead Properties ---

class lead_status_enum(str, Enum):
    """Defines the lifecycle stage of a lead."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"

class lead_type_enum(str, Enum):
    NEW_INQUIRY = "new_inquiry"
    FOLLOW_UP = "follow_up"
    CALLBACK_REQUEST = "callback_request"

class priority_enum(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# --- Lead Schemas ---

class LeadBase(BaseModel):
    """Base schema with core information about a potential customer."""
    name: str = Field(..., description="Full name of the lead.", example="Jane Doe")
    email: EmailStr = Field(..., description="Email address of the lead.", example="jane.doe@example.com")
    phonenumber: Optional[str] = Field(None, description="Phone number of the lead.", example="555-123-4567")

    status: lead_status_enum = Field(default=lead_status_enum.NEW,  description="The current stage of the lead in the sales funnel.")
    lead_type: lead_type_enum = Field(..., example=lead_type_enum.NEW_INQUIRY)
    priority: priority_enum = Field(default=priority_enum.MEDIUM)
    source: Optional[str] = Field(None, description="Where the lead came from (e.g., 'Website', 'Referral').", example="Website")
    notes: Optional[str] = Field(None, description="Additional notes about the lead.")
    last_notified: Optional[datetime] = Field(None, description="Timestamp of when the lead was last notified or contacted.")
    
class LeadCreate(LeadBase):
    """Schema used to create a new lead. Inherits all fields from LeadBase."""
    pass

class LeadUpdate(BaseModel):
    """Schema for updating a lead. All fields are optional."""
    name: Optional[str] = Field(None)
    email: Optional[EmailStr] = Field(None)
    phone_number: Optional[str] = Field(None)
    status: Optional[lead_status_enum] = Field(None)
    lead_type: Optional[lead_type_enum] = Field(None)
    priority: Optional[priority_enum] = Field(None)
    source: Optional[str] = Field(None)
    notes: Optional[str] = Field(None)
    last_notified: Optional[datetime] = Field(None)


class Lead(LeadBase):
    """Full Lead schema for reading data from the database."""
    lead_id: int = Field()
    created_at: datetime = Field()

    # This configuration allows the model to be created from database objects
    # and correctly handle the aliases for both input and output.
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
