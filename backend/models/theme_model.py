from pydantic import BaseModel, Field, HttpUrl
from typing import Optional

class ThemeBase(BaseModel):
    """Base schema for a themed package."""
    name: str = Field(..., max_length=100, description="The name of the themed package.", example="Jungle Escape")
    description: str = Field(..., description="A detailed description of the theme.")
    duration: int = Field(..., gt=0, description="The duration of the experience in minutes.", example=60)
    minimum_players: int = Field(..., gt=0, description="The minimum number of players required.", example=2)
    trailers: Optional[str] = Field(None, description="An optional URL to a promotional trailer.", example="https://www.youtube.com/watch?v=example")
    price_per_person: float = Field(..., ge=0, description="The price per person for the package.", example=999.50)

class ThemeCreate(ThemeBase):
    """Schema for creating a new themed package."""
    pass

class ThemeUpdate(BaseModel):
    """Schema for updating an existing theme. All fields are optional."""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    duration: Optional[int] = Field(None, gt=0)
    minimum_players: Optional[int] = Field(None, gt=0)
    trailers: Optional[HttpUrl] = None
    price_per_person: Optional[float] = Field(None, ge=0)

class Theme(ThemeBase):
    """Schema for representing a theme record from the database."""
    theme_id: int = Field(..., description="Primary key for the theme.", example=1)

    class Config:
        from_attributes = True