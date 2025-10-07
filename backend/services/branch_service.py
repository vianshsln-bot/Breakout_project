from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.branch_model import Branch, BranchCreate, BranchUpdate

def create_branch(branch_data: BranchCreate) -> Branch:
    """Creates a new branch record."""
    try:
        branch_dict = branch_data.model_dump(mode="json")
        response = supabase.table("branch").insert(branch_dict).execute()
        return Branch(**response.data[0])
    except APIError as e:
        raise e

def get_all_branches() -> List[Branch]:
    """Retrieves a list of all branches."""
    try:
        response = supabase.table("branch").select("*").execute()
        return [Branch(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_branch_by_id(branch_id: int) -> Optional[Branch]:
    """Retrieves a single branch by its ID."""
    try:
        response = supabase.table("branch").select("*").eq("branch_id", branch_id).single().execute()
        return Branch(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching branch by ID {branch_id}: {e.message}")
        return None

def update_branch(branch_id: int, branch_data: BranchUpdate) -> Optional[Branch]:
    """Updates an existing branch's record."""
    try:
        update_dict = branch_data.model_dump(exclude_unset=True,mode="json")
        if not update_dict:
            return get_branch_by_id(branch_id)
        
        response = supabase.table("branch").update(update_dict).eq("branch_id", branch_id).execute()
        return Branch(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_branch(branch_id: int) -> Optional[Branch]:
    """Deletes a branch from the database."""
    try:
        response = supabase.table("branch").delete().eq("branch_id", branch_id).execute()
        return Branch(**response.data[0]) if response.data else None
    except APIError as e:
        raise e