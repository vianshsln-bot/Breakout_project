from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    """Base schema with fields common to creating and reading a customer."""
    name: str = Field(...,  description="Full name of the customer.", example="John Smith")
    email: EmailStr = Field(..., description="Email address of the customer.", example="john.smith@example.com")
    phone_number: Optional[str] = Field(None, description="Phone number of the customer.", example="555-987-6543")
    original_lead_id: int = Field(..., description="The ID of the lead that this customer was converted from.")

class CustomerCreate(CustomerBase):
    """Schema for creating a new customer record from a converted lead."""
    pass

class CustomerUpdate(BaseModel):
    """Schema for updating a customer. All fields are optional."""
    name: Optional[str] = Field(None )
    email: Optional[EmailStr] = Field(None)
    phone_number: Optional[str] = Field(None)
    original_lead_id: Optional[int] = Field(None)


class Customer(CustomerBase):
    """Full Customer schema for reading data from the database."""
    customer_id: int = Field(...)
    customer_since: datetime = Field(...)

    # This configuration allows the model to be created from database objects
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)