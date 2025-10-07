from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMode(str, Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    UPI = "upi"
    NET_BANKING = "net_banking"
    CASH = "cash"

class PaymentBase(BaseModel):
    """Base schema for a payment."""
    payer_name: str = Field(..., max_length=100, description="The name of the person making the payment.", example="John Doe")
    payment_amount: float = Field(..., gt=0, description="The amount of the payment.", example=2500.00)
    payment_status: PaymentStatus = Field(default=PaymentStatus.PENDING, description="The current status of the payment.")
    payment_mode: PaymentMode = Field(..., description="The mode of payment used.", example=PaymentMode.UPI)

class PaymentCreate(BaseModel):
    """Schema for creating a new payment record."""
    payer_name: str = Field(..., max_length=100)
    payment_amount: float = Field(..., gt=0)
    payment_mode: PaymentMode
    payment_status: Optional[PaymentStatus] = PaymentStatus.PENDING

class PaymentUpdate(BaseModel):
    """Schema for updating an existing payment. All fields are optional."""
    payer_name: Optional[str] = Field(None, max_length=100)
    payment_amount: Optional[float] = Field(None, gt=0)
    payment_status: Optional[PaymentStatus] = None
    payment_mode: Optional[PaymentMode] = None

class Payment(PaymentBase):
    """Schema for representing a payment record from the database."""
    payment_ID: int = Field(..., description="Primary key for the payment.", example=1)

    class Config:
        from_attributes = True