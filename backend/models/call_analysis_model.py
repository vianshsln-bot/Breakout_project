from pydantic import BaseModel, Field
from typing import Optional

class CallAnalysisBase(BaseModel):
    """Base schema for call analysis."""
    conv_id: str = Field(..., description="The conversation ID this analysis pertains to.", example="conv_a1b2c3d4e5")
    out_of_scope: bool = Field(False, description="Flag indicating if the call was out of scope for the AI.")
    human_agent_flag: bool = Field(False, description="Flag indicating if a human agent was involved.")
    ai_detect_flag: bool = Field(True, description="Flag indicating if the AI handled the call detection.")
    summary: Optional[str] = Field(None, description="A summary of the conversation.")
    customer_rating: Optional[int] = Field(None, ge=1, le=5, description="Customer rating on a scale of 1–5.", example=4)
    sentiment_score: Optional[float] = Field(None, ge=-1.0, le=1.0, description="Sentiment score from -1 (negative) to 1 (positive).", example=0.8)
    emotional_score: Optional[float] = Field(None, ge=-1.0, le=1.0, description="Emotional score from -1 (negative) to 1 (positive).", example=0.6)
    human_intervention_reason: Optional[str] = Field(None, description="Reason why a human agent intervened.")
    failed_conversion_reason: Optional[str] = Field(None, description="Reason why the call failed to convert.")

class CallAnalysisCreate(CallAnalysisBase):
    """Schema for creating a new call analysis record."""
    pass

class CallAnalysisUpdate(BaseModel):
    """Schema for updating a call analysis record. All fields are optional."""
    out_of_scope: Optional[bool] = None
    human_agent_flag: Optional[bool] = None
    ai_detect_flag: Optional[bool] = None
    summary: Optional[str] = None
    customer_rating: Optional[int] = Field(None, ge=1, le=5)
    sentiment_score: Optional[float] = Field(None, ge=-1.0, le=1.0)
    emotional_score: Optional[float] = Field(None, ge=-1.0, le=1.0)
    human_intervention_reason: Optional[str] = None
    failed_conversion_reason: Optional[str] = None

class CallAnalysis(CallAnalysisBase):
    """Schema for representing a call analysis record from the database."""
    analysis_id: int = Field(..., description="Primary key for the call analysis record.", example=1)

    class Config:
        from_attributes = True
