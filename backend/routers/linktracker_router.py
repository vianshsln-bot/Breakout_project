from typing import List, Optional
from postgrest import APIError
from fastapi import APIRouter, HTTPException, status, Query
from backend.config.supabase_client import supabase
from backend.models.linktracker_model import LinkTracker, LinkTrackerCreate, LinkTrackerUpdate
from backend.services import linktracker_service

router = APIRouter(
    prefix="/linktrackers",
    tags=["LinkTrackers"]
)

@router.post("/", response_model=LinkTracker, status_code=status.HTTP_201_CREATED)
def create_new_link_tracker(link_tracker_data: LinkTrackerCreate):
    """Create a new link tracker."""
    try:
        return linktracker_service.create_link_tracker(link_tracker_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[LinkTracker])
def read_all_link_trackers(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all link trackers."""
    try:
        return linktracker_service.get_all_link_trackers(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{link_id}", response_model=LinkTracker)
def read_link_tracker_by_id(link_id: int):
    """Retrieve a specific link tracker by its ID."""
    link_tracker = linktracker_service.get_link_tracker_by_id(link_id)
    if not link_tracker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link tracker not found")
    return link_tracker

@router.patch("/{link_id}", response_model=LinkTracker)
def update_existing_link_tracker(link_id: int, link_tracker_data: LinkTrackerUpdate):
    """Update an existing link tracker's details."""
    try:
        updated_link_tracker = linktracker_service.update_link_tracker(link_id, link_tracker_data)
        if not updated_link_tracker:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link tracker not found")
        return updated_link_tracker
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{link_id}", response_model=LinkTracker)
def delete_existing_link_tracker(link_id: int):
    """Delete a link tracker."""
    deleted_link_tracker = linktracker_service.delete_link_tracker(link_id)
    if not deleted_link_tracker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link tracker not found")
    return deleted_link_tracker