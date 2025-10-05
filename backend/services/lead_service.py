# file: services/lead_service.py

from typing import List, Dict, Any
from postgrest import APIResponse

from backend.config.supabase_client import supabase
from backend.models.lead_model import LeadCreate,LeadUpdate

def create_lead(lead: LeadCreate) -> Dict[str, Any]:
    """Creates a new lead record in the database."""
    lead_dict = lead.model_dump(by_alias=True,mode="json")
    response: APIResponse = supabase.table("Leads").insert(lead_dict).execute()
    
    if response.data:
        return response.data[0]
    raise Exception("Could not create lead.")

def get_lead_by_id(lead_id: int) -> Dict[str, Any] | None:
    """Retrieves a single lead by their ID."""
    response: APIResponse = supabase.table("Leads").select("*").eq("Lead_ID", lead_id).single().execute()
    return response.data if response.data else None

def get_all_leads(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieves a list of all leads with pagination."""
    response: APIResponse = supabase.table("Leads").select("*").range(skip, skip + limit - 1).execute()
    return response.data if response.data else []

def update_lead(lead_id: int, lead_update: LeadUpdate) -> Dict[str, Any] | None:
    """Updates an existing lead's information."""
    update_data = lead_update.model_dump(by_alias=True, exclude_unset=True,mode="json")
    
    if not update_data:
        return get_lead_by_id(lead_id)
        
    response: APIResponse = supabase.table("Leads").update(update_data).eq("Lead_ID", lead_id).execute()
    return response.data[0] if response.data else None

def delete_lead(lead_id: int) -> Dict[str, Any] | None:
    """Deletes a lead record from the database."""
    response: APIResponse = supabase.table("Leads").delete().eq("Lead_ID", lead_id).execute()
    return response.data[0] if response.data else None
