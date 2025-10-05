from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.event_model import Event, EventCreate, EventUpdate

def create_event(event_data: EventCreate) -> Event:
    """Creates a new event record."""
    try:
        event_dict = event_data.model_dump(mode="json")
        response = supabase.table("Events").insert(event_dict).execute()
        return Event(**response.data[0])
    except APIError as e:
        raise e

def get_all_events(skip: int = 0, limit: int = 100) -> List[Event]:
    """Retrieves a list of all events."""
    try:
        response = supabase.table("Events").select("*").range(skip, skip + limit - 1).execute()
        return [Event(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_event_by_id(event_id: int) -> Optional[Event]:
    """Retrieves a single event by its ID."""
    try:
        response = supabase.table("Events").select("*").eq("event_id", event_id).single().execute()
        return Event(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching event by ID {event_id}: {e.message}")
        return None

def get_events_by_customer_id(customer_id: int) -> List[Event]:
    """Retrieves all events for a specific customer."""
    try:
        response = supabase.table("Events").select("*").eq("customer_id", customer_id).execute()
        return [Event(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def update_event(event_id: int, event_data: EventUpdate) -> Optional[Event]:
    """Updates an existing event's record."""
    try:
        update_dict = event_data.model_dump(exclude_unset=True,mode="json")
        if not update_dict:
            return get_event_by_id(event_id)
        
        response = supabase.table("Events").update(update_dict).eq("event_id", event_id).execute()
        return Event(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_event(event_id: int) -> Optional[Event]:
    """Deletes an event from the database."""
    try:
        response = supabase.table("Events").delete().eq("event_id", event_id).execute()
        return Event(**response.data[0]) if response.data else None
    except APIError as e:
        raise e