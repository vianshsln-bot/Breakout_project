from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    name: str = Field(..., description="Full name of the customer.", example="John Smith")
    email: EmailStr = Field(..., description="Email address of the customer.", example="john.smith@example.com")
    phone_number: Optional[str] = Field(None, description="Phone number of the customer.", example="555-987-6543")

class CustomerCreate(CustomerBase):
    customer_id: str = Field(..., description="Unique customer ID provided by Bookeo", example="cust_1234")

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None)
    email: Optional[EmailStr] = Field(None)
    phone_number: Optional[str] = Field(None)

class Customer(CustomerBase):
    customer_id: str
    customer_since: datetime

    class Config:
        orm_mode = True
