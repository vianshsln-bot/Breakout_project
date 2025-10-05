from pydantic import BaseModel, Field
from typing import Optional

class LinkTrackerBase(BaseModel):
    """Base schema for a link tracker."""
    customer_id: int = Field(..., description="Foreign key for the customer who received the link.", example=201)
    follow_up_id: int = Field(..., description="Foreign key for the follow-up associated with this link.", example=51)
    converted_to_booking: bool = Field(False, description="Flag indicating if the link led to a confirmed booking.")
    link_clicked_flag: bool = Field(False, description="Flag indicating if the customer clicked the link.")

class LinkTrackerCreate(LinkTrackerBase):
    """Schema for creating a new link tracker record."""
    pass

class LinkTrackerUpdate(BaseModel):
    """Schema for updating an existing link tracker. All fields are optional."""
    customer_id: Optional[int] = None
    follow_up_id: Optional[int] = None
    converted_to_booking: Optional[bool] = None
    link_clicked_flag: Optional[bool] = None

class LinkTracker(LinkTrackerBase):
    """Schema for representing a link tracker record from the database."""
    link_id: int = Field(..., description="Primary key for the link tracker.", example=1)

    class Config:
        from_attributes = True