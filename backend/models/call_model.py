from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime 
class CallBase(BaseModel):
    """Base schema for a call record."""
    customer_id: int = Field(..., description="Foreign key for the customer making the call.", example=201)
    transcript: Optional[str] = Field(None, description="The full transcript of the call.")
    date_time: datetime = Field(..., description="The time the call was made.", example="2025-10-04T14:30:00Z")
    duration: Optional[int] = Field(None, gt=0, description="Duration of the call in seconds.", example=375.5)
    call_intent: Optional[str] = Field(None, max_length=100, description="The detected intent of the call.", example="New Booking Inquiry")
    credits_consumed: Optional[float] = Field(None, ge=0, description="Credits or cost consumed by the call.", example=1.25)

class CallCreate(CallBase):
    """Schema for creating a new call record. The conv_id is provided here."""
    conv_id: str = Field(..., max_length=100, description="Unique conversation ID for the call.", example="conv_a1b2c3d4e5")

class CallUpdate(BaseModel):
    """Schema for updating a call record. All fields are optional."""
    transcript: Optional[str] = None
    duration: Optional[float] = Field(None, gt=0)
    call_intent: Optional[str] = Field(None, max_length=100)
    credits_consumed: Optional[float] = Field(None, ge=0)

class Call(CallBase):
    """Schema for representing a call record from the database, including the primary key."""
    conv_id: str = Field(..., max_length=100, description="Primary key: Unique conversation ID.", example="conv_a1b2c3d4e5")

    class Config:
        from_attributes = True
