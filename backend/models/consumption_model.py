from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class ConsumptionType(str, Enum):
    """Enumeration for the types of service consumption."""
    ELEVEN_LABS = "Eleven_labs"
    SIP_TRUNKING = "SIP_trunking"
    TWILIO = "twilio"
    WHATSAPP = "whatsapp_message"

class ConsumptionBase(BaseModel):
    """Base schema for a consumption record."""
    branch_id: int = Field(..., description="Foreign key for the branch where consumption occurred.", example=1)
    conv_id: str = Field(..., description="The conversation ID associated with this consumption.", example="conv_a1b2c3d4e5")
    follow_up_id: Optional[int] = Field(None, description="Foreign key for the follow-up associated with this consumption, if any.", example=51)
    consumption_type: ConsumptionType = Field(..., description="The type of service that was consumed.", example=ConsumptionType.SIP_TRUNKING)
    credits_consumed: float = Field(..., ge=0, description="The number of credits consumed.", example=0.75)
    cost_in_rupees: float = Field(..., ge=0, description="The total cost of the consumption in Rupees.", example=5.50)

class ConsumptionCreate(ConsumptionBase):
    """Schema for creating a new consumption record."""
    pass

class ConsumptionUpdate(BaseModel):
    """Schema for updating a consumption record. Generally, log entries aren't updated, but this is available if needed."""
    branch_id: Optional[int] = None
    conv_id: Optional[str] = None
    follow_up_id: Optional[int] = None
    consumption_type: Optional[ConsumptionType] = None
    credits_consumed: Optional[float] = Field(None, ge=0)
    cost_in_rupees: Optional[float] = Field(None, ge=0)


class Consumption(ConsumptionBase):
    """Schema for representing a consumption record from the database."""
    consumption_id: int = Field(..., description="Primary key for the consumption record.", example=1001)

    class Config:
        from_attributes = True