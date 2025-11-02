from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import slot_service
from backend.models.slot_model import Slot, SlotCreate, SlotUpdate

router = APIRouter(
    prefix="/slots",
    tags=["Slots"]
)

@router.post("/", response_model=Slot, status_code=status.HTTP_201_CREATED)
def create_new_slot(slot_data: SlotCreate):
    """Create a new slot."""
    try:
        return slot_service.create_slot(slot_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Slot])
def read_all_slots(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all slots."""
    try:
        return slot_service.get_all_slots(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{slot_id}", response_model=Slot)
def read_slot_by_id(slot_id: int):
    """Retrieve a specific slot by its ID."""
    slot = slot_service.get_slot_by_id(slot_id)
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    return slot

@router.patch("/{slot_id}", response_model=Slot)
def update_existing_slot(slot_id: int, slot_data: SlotUpdate):
    """Update an existing slot's details."""
    try:
        updated_slot = slot_service.update_slot(slot_id, slot_data)
        if not updated_slot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
        return updated_slot
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{slot_id}", response_model=Slot)
def delete_existing_slot(slot_id: int):
    """Delete a slot."""
    deleted_slot = slot_service.delete_slot(slot_id)
    if not deleted_slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    return deleted_slot