from pydantic import BaseModel, Field
from typing import Optional

class ThemeBase(BaseModel):
    theme_id: str = Field(..., description="Unique identifier for the theme.")
    name: str = Field(..., description="The name of the themed package.")
    description: Optional[str] = Field(None, description="A detailed description of the theme.")
    duration_minutes: int = Field(..., gt=0, description="The duration of the experience in minutes.")
    booking_limit_min: int = Field(..., gt=0, description="The minimum number of players required.")
    booking_limit_max: int = Field(..., ge=1, description="The maximum number of players allowed.")

class ThemeCreate(ThemeBase):
    pass

class ThemeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    booking_limit_min: Optional[int] = Field(None, gt=0)
    booking_limit_max: Optional[int] = Field(None, ge=1)

class Theme(ThemeBase):
    class Config:
        from_attributes = True
