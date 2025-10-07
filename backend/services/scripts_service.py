from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.scripts_model import Script, ScriptCreate, ScriptUpdate

def create_script(script_data: ScriptCreate) -> Script:
    """Creates a new script record."""
    try:
        script_dict = script_data.model_dump(mode="json")
        response = supabase.table("scripts").insert(script_dict).execute()
        return Script(**response.data[0])
    except APIError as e:
        raise e

def get_all_scripts(skip: int = 0, limit: int = 100) -> List[Script]:
    """Retrieves a list of all scripts."""
    try:
        response = supabase.table("scripts").select("*").range(skip, skip + limit - 1).execute()
        return [Script(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_script_by_id(script_id: int) -> Optional[Script]:
    """Retrieves a single script by its ID."""
    try:
        response = supabase.table("scripts").select("*").eq("script_id", script_id).single().execute()
        return Script(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching script by ID {script_id}: {e.message}")
        return None

def get_scripts_by_branch_id(branch_id: int) -> List[Script]:
    """Retrieves all scripts for a specific branch."""
    try:
        response = supabase.table("scripts").select("*").eq("branch_id", branch_id).execute()
        return [Script(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def update_script(script_id: int, script_data: ScriptUpdate) -> Optional[Script]:
    """Updates an existing script's record."""
    try:
        update_dict = script_data.model_dump(exclude_unset=True,mode="json")
        if not update_dict:
            return get_script_by_id(script_id)
        response = supabase.table("scripts").update(update_dict).eq("script_id", script_id).execute()
        return Script(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_script(script_id: int) -> Optional[Script]:
    """Deletes a script from the database."""
    try:
        response = supabase.table("scripts").delete().eq("script_id", script_id).execute()
        return Script(**response.data[0]) if response.data else None
    except APIError as e:
        raise e