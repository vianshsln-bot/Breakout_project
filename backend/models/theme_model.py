from pydantic import BaseModel, Field, HttpUrl
from typing import Optional

class ThemeBase(BaseModel):
    """Base schema for a themed package."""
    Name: str = Field(..., max_length=100, description="The name of the themed package.", example="Jungle Escape")
    Description: str = Field(..., description="A detailed description of the theme.")
    Duration: int = Field(..., gt=0, description="The duration of the experience in minutes.", example=60)
    Minimum_players: int = Field(..., gt=0, description="The minimum number of players required.", example=2)
    Trailers: Optional[str] = Field(None, description="An optional URL to a promotional trailer.", example="https://www.youtube.com/watch?v=example")
    Price_per_person: float = Field(..., ge=0, description="The price per person for the package.", example=999.50)

class ThemeCreate(ThemeBase):
    """Schema for creating a new themed package."""
    pass

class ThemeUpdate(BaseModel):
    """Schema for updating an existing theme. All fields are optional."""
    Name: Optional[str] = Field(None, max_length=100)
    Description: Optional[str] = None
    Duration: Optional[int] = Field(None, gt=0)
    Minimum_players: Optional[int] = Field(None, gt=0)
    Trailers: Optional[HttpUrl] = None
    Price_per_person: Optional[float] = Field(None, ge=0)

class Theme(ThemeBase):
    """Schema for representing a theme record from the database."""
    Theme_ID: int = Field(..., description="Primary key for the theme.", example=1)

    class Config:
        from_attributes = True