from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.followup_model import FollowUp, FollowUpCreate, FollowUpUpdate

def create_follow_up(follow_up_data: FollowUpCreate) -> FollowUp:
    """Creates a new follow-up record."""
    try:
        follow_up_dict = follow_up_data.model_dump(mode="json")
        response = supabase.table("Follow_up").insert(follow_up_dict).execute()
        return FollowUp(**response.data[0])
    except APIError as e:
        raise e

def get_all_follow_ups(skip: int = 0, limit: int = 100) -> List[FollowUp]:
    """Retrieves a list of all follow-ups."""
    try:
        response = supabase.table("Follow_up").select("*").range(skip, skip + limit - 1).execute()
        return [FollowUp(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_follow_up_by_id(follow_up_id: int) -> Optional[FollowUp]:
    """Retrieves a single follow-up by its ID."""
    try:
        response = supabase.table("Follow_up").select("*").eq("follow_up_id", follow_up_id).single().execute()
        return FollowUp(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching follow-up by ID {follow_up_id}: {e.message}")
        return None

def get_follow_ups_by_lead_id(lead_id: int) -> List[FollowUp]:
    """Retrieves all follow-ups for a specific lead."""
    try:
        response = supabase.table("Follow_up").select("*").eq("lead_id", lead_id).execute()
        return [FollowUp(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def update_follow_up(follow_up_id: int, follow_up_data: FollowUpUpdate) -> Optional[FollowUp]:
    """Updates an existing follow-up's record."""
    try:
        update_dict = follow_up_data.model_dump(exclude_unset=True,mode="json")
        if not update_dict:
            return get_follow_up_by_id(follow_up_id)
        
        response = supabase.table("Follow_up").update(update_dict).eq("follow_up_id", follow_up_id).execute()
        return FollowUp(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_follow_up(follow_up_id: int) -> Optional[FollowUp]:
    """Deletes a follow-up from the database."""
    try:
        response = supabase.table("Follow_up").delete().eq("follow_up_id", follow_up_id).execute()
        return FollowUp(**response.data[0]) if response.data else None
    except APIError as e:
        raise e