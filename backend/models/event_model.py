from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EventBase(BaseModel):
    """Base schema for an event."""
    customer_id: int = Field(..., description="Foreign key for the customer associated with the event.", example=201)
    guest_count: int = Field(..., gt=0, description="The number of guests for the event.", example=50)
    proposed_date: datetime = Field(..., description="The proposed date and time for the event.", example="2025-11-15T19:00:00Z")
    event_type: str = Field(..., max_length=100, description="The type of event (e.g., Corporate, Wedding).", example="Corporate")
    agent_id: int = Field(..., description="Foreign key for the agent/employee managing the event.", example=102)

class EventCreate(EventBase):
    """Schema for creating a new event."""
    pass

class EventUpdate(BaseModel):
    """Schema for updating an existing event. All fields are optional."""
    customer_id: Optional[int] = None
    guest_count: Optional[int] = Field(None, gt=0)
    proposed_date: Optional[datetime] = None
    event_type: Optional[str] = Field(None, max_length=100)
    agent_id: Optional[int] = None

class Event(EventBase):
    """Schema for representing an event record from the database."""
    event_id: int = Field(..., description="Primary key for the event.", example=1)

    class Config:
        from_attributes = True