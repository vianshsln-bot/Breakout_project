# backend/models/payment_model.py

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class PaymentStatus(str, Enum):
    INVALID = "invalid"
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMode(str, Enum):
    CREDIT_CARD = "creditCard"
    DEBIT_CARD = "debitCard"
    UPI = "upi"
    NET_BANKING = "netBanking"
    CASH = "cash"
    OTHER = "other"


class PaymentBase(BaseModel):
    payment_id: str = Field(..., description="Bookeo payment UUID", example="42561R6N7PT199E2AD47AB")
    customer_id: str = Field(..., description="Bookeo customer UUID", example="42561FFYW63199E19302B1")
    booking_id: str = Field(..., description="Extracted booking ID from description", example="2561510147820801")
    payment_amount: float = Field(..., gt=0, description="The amount of the payment.", example=1400.00)
    currency: str = Field(..., max_length=10, description="Currency code.", example="INR")
    payment_method: PaymentMode = Field(..., description="The mode of payment used.", example=PaymentMode.CREDIT_CARD)
    payment_method_other: Optional[str] = Field(None, description="Custom payment method when mode is OTHER.")
    payment_status: PaymentStatus = Field(default=PaymentStatus.INVALID, description="The current status of the payment.")
    reason: Optional[str] = Field(None, description="Payment reason.", example="Initial payment")
    comment: Optional[str] = Field(None, description="Optional comment.")
    agent: Optional[str] = Field(None, description="Agent or application name.")
    creation_time: Optional[datetime] = Field(None, description="Timestamp when payment was created.")
    received_time: Optional[datetime] = Field(None, description="Timestamp when payment was received.")

    class Config:
        orm_mode = True


class PaymentCreate(BaseModel):
    payment_id: str = Field(..., description="Bookeo payment UUID")
    customer_id: str = Field(..., description="Bookeo customer UUID")
    booking_id: str = Field(..., description="Extracted booking ID from description")
    payment_amount: float = Field(..., gt=0, description="The amount of the payment.")
    currency: str = Field(..., max_length=10, description="Currency code.", example="INR")
    payment_method: PaymentMode = Field(..., description="The mode of payment used.")
    payment_method_other: Optional[str] = Field(None, description="Custom payment method when mode is OTHER.")
    payment_status: Optional[PaymentStatus] = Field(PaymentStatus.PENDING, description="The current status of the payment.")
    reason: Optional[str] = Field(None, description="Payment reason.")
    comment: Optional[str] = Field(None, description="Optional comment.")
    agent: Optional[str] = Field(None, description="Agent or application name.")
    creation_time: Optional[datetime] = Field(None, description="Timestamp when payment was created.")
    received_time: Optional[datetime] = Field(None, description="Timestamp when payment was received.")


class PaymentUpdate(BaseModel):
    payment_amount: Optional[float] = Field(None, gt=0, description="The amount of the payment.")
    currency: Optional[str] = Field(None, max_length=10, description="Currency code.", example="INR")
    payment_method: Optional[PaymentMode] = Field(None, description="The mode of payment used.")
    payment_method_other: Optional[str] = Field(None, description="Custom payment method when mode is OTHER.")
    payment_status: Optional[PaymentStatus] = Field(None, description="The current status of the payment.")
    reason: Optional[str] = Field(None, description="Payment reason.")
    comment: Optional[str] = Field(None, description="Optional comment.")
    agent: Optional[str] = Field(None, description="Agent or application name.")



class Payment(PaymentBase):
    """Schema for representing a payment record retrieved from the database."""
    pass