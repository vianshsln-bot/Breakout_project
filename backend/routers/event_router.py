from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import event_service
from backend.models.event_model import Event, EventCreate, EventUpdate


# file: routers/event.py


router = APIRouter(
    prefix="/events",
    tags=["Events"]
)

@router.post("/", response_model=Event, status_code=status.HTTP_201_CREATED)
def create_new_event(event: EventCreate):
    """Endpoint to create a new event."""
    try:
        new_event_data = event_service.create_event(event)
        return new_event_data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[Event])
def read_all_events(skip: int = 0, limit: int = 100):
    """Endpoint to retrieve all events."""
    events = event_service.get_all_events(skip=skip, limit=limit)
    return events

@router.get("/{event_id}", response_model=Event)
def read_event_by_id(event_id: int):
    """Endpoint to retrieve a specific event by its ID."""
    event = event_service.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event

@router.patch("/{event_id}", response_model=Event)
def update_existing_event(event_id: int, event_update: EventUpdate):
    """Endpoint to update an event's details."""
    updated_event = event_service.update_event(event_id, event_update)
    if not updated_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return updated_event

@router.delete("/{event_id}", response_model=Event)
def delete_existing_event(event_id: int):
    """Endpoint to delete an event."""
    deleted_event = event_service.delete_event(event_id)
    if not deleted_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return deleted_event