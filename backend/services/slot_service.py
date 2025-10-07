from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.slot_model import Slot, SlotCreate, SlotUpdate

def create_slot(slot_data: SlotCreate) -> Slot:
    """Creates a new slot record."""
    try:
        slot_dict = slot_data.model_dump(mode='json')
        response = supabase.table("slots").insert(slot_dict).execute()
        return Slot(**response.data[0])
    except APIError as e:
        raise e

def get_all_slots(skip: int = 0, limit: int = 100) -> List[Slot]:
    """Retrieves a list of all slots."""
    try:
        response = supabase.table("slots").select("*").range(skip, skip + limit - 1).execute()
        return [Slot(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_slot_by_id(slot_id: int) -> Optional[Slot]:
    """Retrieves a single slot by its ID."""
    try:
        response = supabase.table("slots").select("*").eq("slot_id", slot_id).single().execute()
        return Slot(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching slot by ID {slot_id}: {e.message}")
        return None

def update_slot(slot_id: int, slot_data: SlotUpdate) -> Optional[Slot]:
    """Updates an existing slot's record."""
    try:
        update_dict = slot_data.model_dump(exclude_unset=True, mode='json')
        if not update_dict:
            return get_slot_by_id(slot_id)
        
        response = supabase.table("slots").update(update_dict).eq("slot_id", slot_id).execute()
        return Slot(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_slot(slot_id: int) -> Optional[Slot]:
    """Deletes a slot from the database."""
    try:
        response = supabase.table("slots").delete().eq("slot_id", slot_id).execute()
        return Slot(**response.data[0]) if response.data else None
    except APIError as e:
        raise e