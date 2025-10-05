from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.consumption_model import Consumption, ConsumptionCreate

def create_consumption(consumption_data: ConsumptionCreate) -> Consumption:
    """Creates a new consumption log entry."""
    try:
        consumption_dict = consumption_data.model_dump(mode="json")
        response = supabase.table("consumption").insert(consumption_dict).execute()
        return Consumption(**response.data[0])
    except APIError as e:
        raise e

def get_all_consumptions(skip: int = 0, limit: int = 100) -> List[Consumption]:
    """Retrieves a list of all consumption records."""
    try:
        response = supabase.table("consumption").select("*").range(skip, skip + limit - 1).execute()
        return [Consumption(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_consumption_by_id(consumption_id: int) -> Optional[Consumption]:
    """Retrieves a single consumption record by its ID."""
    try:
        response = supabase.table("consumption").select("*").eq("consumption_id", consumption_id).single().execute()
        return Consumption(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching consumption by ID {consumption_id}: {e.message}")
        return None

def get_consumptions_by_conv_id(conv_id: str) -> List[Consumption]:
    """Retrieves all consumption records for a specific conversation ID."""
    try:
        response = supabase.table("consumption").select("*").eq("conv_id", conv_id).execute()
        return [Consumption(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e