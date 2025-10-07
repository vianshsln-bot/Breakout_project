from pydantic import BaseModel, Field
from typing import Optional
from datetime import date as dt_date, time as dt_time

class SlotBase(BaseModel):
    """Base schema for a time slot."""
    theme_id: int = Field(..., description="Foreign key for the theme associated with this slot.", example=1)
    date: dt_date = Field(..., description="The date of the slot.", example="2025-12-25")
    time: dt_time = Field(..., description="The time of the slot.", example="14:30:00")
    branch_id: int = Field(..., description="Foreign key for the branch where this slot is available.", example=1)
    slots_left: int = Field(..., ge=0, description="The number of available slots remaining.", example=10)

class SlotCreate(SlotBase):
    """Schema for creating a new slot."""
    pass

class SlotUpdate(BaseModel):
    """Schema for updating an existing slot. All fields are optional."""
    theme_id: Optional[int] = None
    date: Optional[dt_date] = None
    time: Optional[dt_time] = None
    branch_id: Optional[int] = None
    slots_left: Optional[int] = Field(None, ge=0)

class Slot(SlotBase):
    """Schema for representing a slot record from the database."""
    slot_id: int = Field(..., description="Primary key for the slot.", example=1)

    class Config:
        from_attributes = True