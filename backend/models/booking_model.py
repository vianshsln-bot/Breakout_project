from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Booking(BaseModel):
    """Schema representing a booking record from the database."""
    booking_id: str = Field(..., description="Primary key for the booking.", example="bkg_5001")
    event_id: str = Field(..., description="Event or slot ID.", example="evt_123")
    theme_id: Optional[str] = Field(None, description="Foreign key to theme.", example="theme_45")
    start_time: datetime = Field(..., description="Start time of the booking.", example="2025-12-25T14:30:00+00:00")
    end_time: Optional[datetime] = Field(None, description="End time of the booking.", example="2025-12-25T15:30:00+00:00")
    customer_id: Optional[str] = Field(None, description="Foreign key to customer.", example="cust_201")
    status: str = Field(..., description="Booking status.", example="Confirmed")
    creation_time: datetime = Field(..., description="Booking creation timestamp.", example="2025-10-01T10:00:00+00:00")
    conv_id: Optional[str] = Field(None, description="Conversation ID linked to booking.", example="conv_a1b2c3d4e5")
    adults: Optional[int] = Field(None, description="Number of adults.", example=2)
    children: Optional[float] = Field(None, description="Number of children.", example=1)
    total_gross: Optional[float] = Field(None, description="Total gross amount for the booking.", example=2600)
    total_net: Optional[float] = Field(None, description="Total net amount for the booking.", example=2600)
    total_taxes: Optional[float] = Field(None, description="Total taxes for the booking.", example=0)
    total_paid: float = Field(0, description="Total amount paid towards the booking.", example=0)
    class Config:
        from_attributes = True

# "price": {
#         "totalGross": {
#             "amount": "2600",
#             "currency": "INR"
#         },
#         "totalNet": {
#             "amount": "2600",
#             "currency": "INR"
#         },
#         "totalTaxes": {
#             "amount": "0",
#             "currency": "INR"
#         },
#         "totalPaid": {
#             "amount": "0",
#             "currency": "INR"
#         },
#         "taxes": []
#     }

class BookingCreate(BaseModel):
    """Schema for creating a new booking."""
    event_id: str
    theme_id: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    customer_id: Optional[str] = None
    status: str = Field(default="Pending", description="Initial booking status.", example="Pending")
    adults: Optional[int] = Field(None, description="Number of adults.", example=2)
    children: Optional[int] = Field(None, description="Number of children.", example=1)
    total_gross: Optional[float] = Field(None, description="Total gross amount for the booking.", example=2600)
    total_net: Optional[float] = Field(None, description="Total net amount for the booking.", example=2600)
    total_taxes:Optional[float] = Field(None, description="Total taxes for the booking.", example=0)
    total_paid: float = Field(0, description="Total amount paid towards the booking.", example=0)
    conv_id: Optional[str] = None

class BookingUpdate(BaseModel):
    """Schema for updating a booking; all fields optional."""
    event_id: Optional[str] = None
    theme_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    customer_id: Optional[str] = None
    status: Optional[str] = None
    adults: Optional[int] = Field(None, description="Number of adults.", example=2)
    children: Optional[int] = Field(None, description="Number of children.", example=1)
    conv_id: Optional[str] = None
    total_gross: Optional[float] = Field(None, description="Total gross amount for the booking.", example=2600)
    total_net: Optional[float] = Field(None, description="Total net amount for the booking.", example=2600)
    total_taxes: Optional[float] = Field(None, description="Total taxes for the booking.", example=0)
    total_paid: float = Field(0, description="Total amount paid towards the booking.", example=0)
