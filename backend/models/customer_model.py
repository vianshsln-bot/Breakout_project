from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class CustomerBase(BaseModel):
    """Base schema with fields common to creating and reading a customer."""
    name: str = Field(..., alias="Name", description="Full name of the customer.", example="John Smith")
    email: EmailStr = Field(..., alias="Email", description="Email address of the customer.", example="john.smith@example.com")
    phone_number: Optional[str] = Field(None, alias="PhoneNumber", description="Phone number of the customer.", example="555-987-6543")
    original_lead_id: int = Field(..., alias="Original_Lead_ID", description="The ID of the lead that this customer was converted from.")

class CustomerCreate(CustomerBase):
    """Schema for creating a new customer record from a converted lead."""
    pass

class CustomerUpdate(BaseModel):
    """Schema for updating a customer. All fields are optional."""
    name: Optional[str] = Field(None, alias="Name")
    email: Optional[EmailStr] = Field(None, alias="Email")
    phone_number: Optional[str] = Field(None, alias="PhoneNumber")
    original_lead_id: Optional[int] = Field(None, alias="Original_Lead_ID")


class Customer(CustomerBase):
    """Full Customer schema for reading data from the database."""
    customer_id: int = Field(..., alias="Customer_ID")
    customer_since: datetime = Field(..., alias="CustomerSince")

    # This configuration allows the model to be created from database objects
    # and correctly handle the aliases for both input and output.
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)