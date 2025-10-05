
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

class EventStatus(str, Enum):
    """Defines the status of an event."""
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EventBase(BaseModel):
    """Base schema for an event."""
    customer_id: int = Field(..., alias="Customer_ID", description="Foreign key for the customer.")
    guest_count: int = Field(..., alias="Guest_count", gt=0, description="The number of guests.")
    proposed_date: datetime = Field(..., alias="Proposed_date", description="The proposed date and time.")
    event_type: str = Field(..., alias="Event_type", max_length=255, description="The type of event.")
    agent_id: Optional[int] = Field(None, alias="Agent_ID", description="Foreign key for the managing agent.")
    notes: Optional[str] = Field(None, alias="Notes", description="Additional notes for the event.")
    status: EventStatus = Field(default=EventStatus.PROPOSED, alias="Status")

class EventCreate(EventBase):
    """Schema for creating a new event."""
    pass

class EventUpdate(BaseModel):
    """Schema for updating an event. All fields are optional."""
    customer_id: Optional[int] = Field(None, alias="Customer_ID")
    guest_count: Optional[int] = Field(None, alias="Guest_count", gt=0)
    proposed_date: Optional[datetime] = Field(None, alias="Proposed_date")
    event_type: Optional[str] = Field(None, alias="Event_type", max_length=255)
    agent_id: Optional[int] = Field(None, alias="Agent_ID")
    notes: Optional[str] = Field(None, alias="Notes")
    status: Optional[EventStatus] = Field(None, alias="Status")

class Event(EventBase):
    """Full Event schema for reading data from the database."""
    event_id: int = Field(..., alias="Event_ID")
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)