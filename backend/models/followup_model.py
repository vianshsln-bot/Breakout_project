from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class FollowUpType(str, Enum):
    CALLBACK = "callback"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    INITIAL_CONTACT = "initial_contact"

class FollowUpMode(str, Enum):
    MANUAL = "manual"
    AUTOMATED = "automated"

class FollowUpBase(BaseModel):
    """Base schema for a follow-up."""
    lead_id: int = Field(..., description="Foreign key for the lead this follow-up is for.", example=1)
    unique_phone_number: str = Field(..., max_length=20, description="The phone number for the follow-up contact.", example="+919876543210")
    done: bool = Field(False, description="Flag indicating if the follow-up has been completed.")
    time: datetime = Field(..., description="The scheduled date and time for the follow-up.", example="2025-10-05T11:00:00Z")
    type_of_follow_up: FollowUpType = Field(..., example=FollowUpType.CALLBACK)
    confirmed_interest_call: bool = Field(False, description="Flag indicating if the customer confirmed interest.")
    latest_booking_attempt: Optional[datetime] = Field(None, description="Timestamp of the last attempt to book.")
    mode: FollowUpMode = Field(..., example=FollowUpMode.AUTOMATED)

class FollowUpCreate(FollowUpBase):
    """Schema for creating a new follow-up."""
    pass

class FollowUpUpdate(BaseModel):
    """Schema for updating an existing follow-up. All fields are optional."""
    lead_id: Optional[int] = None
    unique_phone_number: Optional[str] = Field(None, max_length=20)
    done: Optional[bool] = None
    time: Optional[datetime] = None
    type_of_follow_up: Optional[FollowUpType] = None
    confirmed_interest_call: Optional[bool] = None
    latest_booking_attempt: Optional[datetime] = None
    mode: Optional[FollowUpMode] = None

class FollowUp(FollowUpBase):
    """Schema for representing a follow-up record from the database."""
    follow_up_id: int = Field(..., description="Primary key for the follow-up.", example=1)

    class Config:
        from_attributes = True