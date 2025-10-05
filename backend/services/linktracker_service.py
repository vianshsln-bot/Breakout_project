from fastapi import APIRouter, HTTPException, status, Query
from typing import List,Optional
from postgrest import APIError

from backend.services import linktracker_service
from backend.models.linktracker_model import LinkTracker, LinkTrackerCreate, LinkTrackerUpdate
from backend.config.supabase_client import supabase

router = APIRouter(
    prefix="/link-trackers",
    tags=["Link Trackers"]
)


def create_link_tracker(link_tracker_data: LinkTrackerCreate) -> LinkTracker:
    """Creates a new link tracker record."""
    try:
        link_tracker_dict = link_tracker_data.model_dump(mode="json")
        response = supabase.table("Link_Tracker").insert(link_tracker_dict).execute()
        return LinkTracker(**response.data[0])
    except APIError as e:
        raise e

def get_all_link_trackers(skip: int = 0, limit: int = 100) -> List[LinkTracker]:
    """Retrieves a list of all link trackers."""
    try:
        response = supabase.table("Link_Tracker").select("*").range(skip, skip + limit - 1).execute()
        return [LinkTracker(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_link_tracker_by_id(link_id: int) -> Optional[LinkTracker]:
    """Retrieves a single link tracker by its ID."""
    try:
        response = supabase.table("Link_Tracker").select("*").eq("link_id", link_id).single().execute()
        return LinkTracker(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching link tracker by ID {link_id}: {e.message}")
        return None

def update_link_tracker(link_id: int, link_tracker_data: LinkTrackerUpdate) -> Optional[LinkTracker]:
    """Updates an existing link tracker's record."""
    try:
        update_dict = link_tracker_data.model_dump(exclude_unset=True,mode="json")
        if not update_dict:
            return get_link_tracker_by_id(link_id)
        
        response = supabase.table("Link_Tracker").update(update_dict).eq("link_id", link_id).execute()
        return LinkTracker(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_link_tracker(link_id: int) -> Optional[LinkTracker]:
    """Deletes a link tracker from the database."""
    try:
        response = supabase.table("Link_Tracker").delete().eq("link_id", link_id).execute()
        return LinkTracker(**response.data[0]) if response.data else None
    except APIError as e:
        raise e