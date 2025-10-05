from pydantic import BaseModel, Field
from typing import Optional
from datetime import date as dt_date, time as dt_time

class SlotBase(BaseModel):
    """Base schema for a time slot."""
    Theme_ID: int = Field(..., description="Foreign key for the theme associated with this slot.", example=1)
    Date: dt_date = Field(..., description="The date of the slot.", example="2025-12-25")
    Time: dt_time = Field(..., description="The time of the slot.", example="14:30:00")
    Branch_ID: int = Field(..., description="Foreign key for the branch where this slot is available.", example=1)
    Slots_left: int = Field(..., ge=0, description="The number of available slots remaining.", example=10)

class SlotCreate(SlotBase):
    """Schema for creating a new slot."""
    pass

class SlotUpdate(BaseModel):
    """Schema for updating an existing slot. All fields are optional."""
    Theme_ID: Optional[int] = None
    Date: Optional[dt_date] = None
    Time: Optional[dt_time] = None
    Branch_ID: Optional[int] = None
    Slots_left: Optional[int] = Field(None, ge=0)

class Slot(SlotBase):
    """Schema for representing a slot record from the database."""
    Slot_ID: int = Field(..., description="Primary key for the slot.", example=1)

    class Config:
        from_attributes = True