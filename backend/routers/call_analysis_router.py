from fastapi import APIRouter, HTTPException, status
from typing import List
from postgrest import APIError

from backend.services import call_analysis_service
from backend.models.call_analysis_model import CallAnalysis, CallAnalysisCreate, CallAnalysisUpdate

router = APIRouter(
    prefix="/call-analysis",
    tags=["Call Analysis"]
)

@router.post("/", response_model=CallAnalysis, status_code=status.HTTP_201_CREATED)
def create_new_call_analysis(analysis_data: CallAnalysisCreate):
    """Create a new call analysis record."""
    try:
        return call_analysis_service.create_call_analysis(analysis_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[CallAnalysis])
def read_all_call_analyses():
    """Retrieve all call analysis records."""
    try:
        return call_analysis_service.get_all_call_analyses()
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{analysis_id}", response_model=CallAnalysis)
def read_call_analysis_by_id(analysis_id: int):
    """Retrieve a specific call analysis by its primary ID."""
    analysis = call_analysis_service.get_call_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call analysis not found")
    return analysis

@router.get("/conversation/{conv_id}", response_model=CallAnalysis)
def read_call_analysis_by_conv_id(conv_id: str):
    """Retrieve a specific call analysis by its conversation ID."""
    analysis = call_analysis_service.get_call_analysis_by_conv_id(conv_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Call analysis for conversation '{conv_id}' not found")
    return analysis

@router.patch("/{analysis_id}", response_model=CallAnalysis)
def update_existing_call_analysis(analysis_id: int, analysis_data: CallAnalysisUpdate):
    """Update an existing call analysis record."""
    try:
        updated_analysis = call_analysis_service.update_call_analysis(analysis_id, analysis_data)
        if not updated_analysis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call analysis not found")
        return updated_analysis
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{analysis_id}", response_model=CallAnalysis)
def delete_existing_call_analysis(analysis_id: int):
    """Delete a call analysis record."""
    deleted_analysis = call_analysis_service.delete_call_analysis(analysis_id)
    if not deleted_analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call analysis not found")
    return deleted_analysis