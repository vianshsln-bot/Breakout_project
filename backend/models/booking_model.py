from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class BookingStatus(str, Enum):
    """Enumeration for the possible statuses of a booking."""
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"
    NO_SHOW = "No-show"

class BookingBase(BaseModel):
    """Base schema for booking, matching the database schema casing exactly."""
    booking_date: datetime = Field(..., description="The date and time the booking is scheduled for.", example="2025-12-25T14:30:00")
    slot_id: Optional[int] = Field(None, description="Foreign key for the specific time slot booked.", example=45)
    customer_id: Optional[int] = Field(None, description="Foreign key for the customer making the booking.", example=201)
    booking_status: BookingStatus = Field(..., description="The current status of the booking.", example="confirmed")
    payment_id: Optional[int] = Field(None, description="Foreign key for the associated payment, if any.", example=303)
    conv_id: Optional[str] = Field(None, max_length=255, description="The conversation ID that resulted in this booking.", example="conv_a1b2c3d4e5")
    guest_count: int = Field(..., description="The number of guests for the booking.", example=2)

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    """Schema for creating a new booking. Fields a user provides."""
    booking_date: datetime
    slot_id: Optional[int] = None
    customer_id: Optional[int] = None
    guest_count: int
    conv_id: Optional[str] = None
    payment_id: Optional[int] = None

class BookingUpdate(BaseModel):
    """Schema for updating an existing booking. All fields are optional."""
    booking_date: Optional[datetime] = None
    slot_id: Optional[int] = None
    customer_id: Optional[int] = None
    booking_status: Optional[BookingStatus] = None
    payment_id: Optional[int] = None
    conv_id: Optional[str] = None
    guest_count: Optional[int] = None

class Booking(BookingBase):
    """Schema for representing a booking record from the database, including the primary key."""
    booking_id: int = Field(..., description="Primary key for the booking.", example=5001)