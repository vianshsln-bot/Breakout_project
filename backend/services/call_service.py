from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.call_model import Call, CallCreate, CallUpdate

def create_call(call_data: CallCreate) -> Call:
    """Creates a new call record."""
    try:
        call_dict = call_data.model_dump(mode='json') # Use mode='json' to serialize date/time
        response = supabase.table("call").insert(call_dict).execute()
        return Call(**response.data[0])
    except APIError as e:
        raise e

def get_all_calls(skip: int = 0, limit: int = 100) -> List[Call]:
    """Retrieves a list of all calls."""
    try:
        response = supabase.table("call").select("*").order("date_time", desc=True).range(skip, skip + limit - 1).execute()
        print(response)
        return [Call(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_call_by_conv_id(conv_id: str) -> Optional[Call]:
    """Retrieves a single call by its conversation ID."""
    try:
        response = supabase.table("call").select("*").eq("conv_id", conv_id).single().execute()
        return Call(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching call by conv_id {conv_id}: {e.message}")
        return None

def get_calls_by_customer_id(customer_id: str) -> List[Call]:
    """Retrieves all calls for a specific customer."""
    try:
        response = supabase.table("call").select("*").eq("customer_id", customer_id).execute()
        return [Call(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def update_call(conv_id: str, call_data: CallUpdate) -> Optional[Call]:
    """Updates an existing call record."""
    try:
        update_dict = call_data.model_dump(exclude_unset=True,mode="json")
        if not update_dict:
            return get_call_by_conv_id(conv_id)

        response = supabase.table("call").update(update_dict).eq("conv_id", conv_id).execute()
        return Call(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_call(conv_id: str) -> Optional[Call]:
    """Deletes a call from the database."""
    try:
        response = supabase.table("call").delete().eq("conv_id", conv_id).execute()
        return Call(**response.data[0]) if response.data else None
    except APIError as e:
        raise e
