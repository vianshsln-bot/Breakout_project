from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.event_model import Event, EventCreate, EventUpdate


# file: services/event_service.py

from typing import List, Dict, Any
from postgrest import APIResponse

def create_event(event: EventCreate) -> Dict[str, Any]:
    """Creates a new event record in the database."""
    event_dict = event.model_dump(by_alias=True,mode="json")
    response: APIResponse = supabase.table("Events").insert(event_dict).execute()
    
    if response.data:
        return response.data[0]
    raise Exception("Could not create event.")

def get_event_by_id(event_id: int) -> Dict[str, Any] | None:
    """Retrieves a single event by its ID."""
    response: APIResponse = supabase.table("Events").select("*").eq("Event_ID", event_id).single().execute()
    return response.data if response.data else None

def get_all_events(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieves a list of all events with pagination."""
    response: APIResponse = supabase.table("Events").select("*").range(skip, skip + limit - 1).execute()
    return response.data if response.data else []

def update_event(event_id: int, event_update: EventUpdate) -> Dict[str, Any] | None:
    """Updates an existing event's information."""
    update_data = event_update.model_dump(by_alias=True, exclude_unset=True,mode="json")
    
    if not update_data:
        return get_event_by_id(event_id)
        
    response: APIResponse = supabase.table("Events").update(update_data).eq("Event_ID", event_id).execute()
    return response.data[0] if response.data else None

def delete_event(event_id: int) -> Dict[str, Any] | None:
    """Deletes an event record from the database."""
    response: APIResponse = supabase.table("Events").delete().eq("Event_ID", event_id).execute()
    return response.data[0] if response.data else None