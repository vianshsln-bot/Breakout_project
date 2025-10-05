from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import followup_service
from backend.models.followup_model import FollowUp, FollowUpCreate, FollowUpUpdate

router = APIRouter(
    prefix="/follow-ups",
    tags=["Follow-ups"]
)

@router.post("/", response_model=FollowUp, status_code=status.HTTP_201_CREATED)
def create_new_follow_up(follow_up_data: FollowUpCreate):
    """Create a new follow-up."""
    try:
        return followup_service.create_follow_up(follow_up_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[FollowUp])
def read_all_follow_ups(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all follow-ups."""
    try:
        return followup_service.get_all_follow_ups(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{follow_up_id}", response_model=FollowUp)
def read_follow_up_by_id(follow_up_id: int):
    """Retrieve a specific follow-up by its ID."""
    follow_up = followup_service.get_follow_up_by_id(follow_up_id)
    if not follow_up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found")
    return follow_up

@router.get("/lead/{lead_id}", response_model=List[FollowUp])
def read_follow_ups_by_lead(lead_id: int):
    """Retrieve all follow-ups for a specific lead."""
    try:
        return followup_service.get_follow_ups_by_lead_id(lead_id)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.patch("/{follow_up_id}", response_model=FollowUp)
def update_existing_follow_up(follow_up_id: int, follow_up_data: FollowUpUpdate):
    """Update an existing follow-up's details."""
    try:
        updated_follow_up = followup_service.update_follow_up(follow_up_id, follow_up_data)
        if not updated_follow_up:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found")
        return updated_follow_up
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{follow_up_id}", response_model=FollowUp)
def delete_existing_follow_up(follow_up_id: int):
    """Delete a follow-up."""
    deleted_follow_up = followup_service.delete_follow_up(follow_up_id)
    if not deleted_follow_up:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up not found")
    return deleted_follow_up