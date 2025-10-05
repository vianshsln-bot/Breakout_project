from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import event_service
from backend.models.event_model import Event, EventCreate, EventUpdate

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)

@router.post("/", response_model=Event, status_code=status.HTTP_201_CREATED)
def create_new_event(event_data: EventCreate):
    """Create a new event."""
    try:
        return event_service.create_event(event_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Event])
def read_all_events(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all events."""
    try:
        return event_service.get_all_events(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{event_id}", response_model=Event)
def read_event_by_id(event_id: int):
    """Retrieve a specific event by its ID."""
    event = event_service.get_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event

@router.get("/customer/{customer_id}", response_model=List[Event])
def read_events_by_customer(customer_id: int):
    """Retrieve all events for a specific customer."""
    try:
        return event_service.get_events_by_customer_id(customer_id)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.patch("/{event_id}", response_model=Event)
def update_existing_event(event_id: int, event_data: EventUpdate):
    """Update an existing event's details."""
    try:
        updated_event = event_service.update_event(event_id, event_data)
        if not updated_event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return updated_event
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{event_id}", response_model=Event)
def delete_existing_event(event_id: int):
    """Delete an event."""
    deleted_event = event_service.delete_event(event_id)
    if not deleted_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return deleted_event