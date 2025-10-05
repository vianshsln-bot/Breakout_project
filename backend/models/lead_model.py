
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

# --- Enums for Lead Properties ---

class LeadStatus(str, Enum):
    """Defines the lifecycle stage of a lead."""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"

class LeadType(str, Enum):
    NEW_INQUIRY = "new_inquiry"
    FOLLOW_UP = "follow_up"
    CALLBACK_REQUEST = "callback_request"

class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# --- Lead Schemas ---

class LeadBase(BaseModel):
    """Base schema with core information about a potential customer."""
    name: str = Field(..., alias="Name", description="Full name of the lead.", example="Jane Doe")
    email: EmailStr = Field(..., alias="Email", description="Email address of the lead.", example="jane.doe@example.com")
    phone_number: Optional[str] = Field(None, alias="PhoneNumber", description="Phone number of the lead.", example="555-123-4567")
    
    status: LeadStatus = Field(default=LeadStatus.NEW, alias="Status", description="The current stage of the lead in the sales funnel.")
    lead_type: LeadType = Field(..., alias="LeadType", example=LeadType.NEW_INQUIRY)
    priority: Priority = Field(default=Priority.MEDIUM, alias="Priority")
    source: Optional[str] = Field(None, alias="Source", description="Where the lead came from (e.g., 'Website', 'Referral').", example="Website")
    notes: Optional[str] = Field(None, alias="Notes", description="Additional notes about the lead.")
    last_notified: Optional[datetime] = Field(None, alias="LastNotified", description="Timestamp of when the lead was last notified or contacted.")
    
class LeadCreate(LeadBase):
    """Schema used to create a new lead. Inherits all fields from LeadBase."""
    pass

class LeadUpdate(BaseModel):
    """Schema for updating a lead. All fields are optional."""
    name: Optional[str] = Field(None, alias="Name")
    email: Optional[EmailStr] = Field(None, alias="Email")
    phone_number: Optional[str] = Field(None, alias="PhoneNumber")
    status: Optional[LeadStatus] = Field(None, alias="Status")
    lead_type: Optional[LeadType] = Field(None, alias="LeadType")
    priority: Optional[Priority] = Field(None, alias="Priority")
    source: Optional[str] = Field(None, alias="Source")
    notes: Optional[str] = Field(None, alias="Notes")
    last_notified: Optional[datetime] = Field(None, alias="LastNotified")


class Lead(LeadBase):
    """Full Lead schema for reading data from the database."""
    lead_id: int = Field(..., alias="Lead_ID")
    created_at: datetime = Field(..., alias="CreatedAt")

    # This configuration allows the model to be created from database objects
    # and correctly handle the aliases for both input and output.
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)