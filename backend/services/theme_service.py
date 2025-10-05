from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.theme_model import Theme, ThemeCreate, ThemeUpdate

def create_theme(theme_data: ThemeCreate) -> Theme:
    """Creates a new theme record."""
    try:
        # Pydantic v2 serializes HttpUrl to a string by default
        theme_dict = theme_data.model_dump(mode='json')
        response = supabase.table("Themes").insert(theme_dict).execute()
        return Theme(**response.data[0])
    except APIError as e:
        raise e

def get_all_themes(skip: int = 0, limit: int = 100) -> List[Theme]:
    """Retrieves a list of all themes."""
    try:
        response = supabase.table("Themes").select("*").range(skip, skip + limit - 1).execute()
        return [Theme(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_theme_by_id(theme_id: int) -> Optional[Theme]:
    """Retrieves a single theme by its ID."""
    try:
        response = supabase.table("Themes").select("*").eq("Theme_ID", theme_id).single().execute()
        return Theme(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching theme by ID {theme_id}: {e.message}")
        return None

def update_theme(theme_id: int, theme_data: ThemeUpdate) -> Optional[Theme]:
    """Updates an existing theme's record."""
    try:
        update_dict = theme_data.model_dump(exclude_unset=True,mode="json")
        if not update_dict:
            return get_theme_by_id(theme_id)

        response = supabase.table("Themes").update(update_dict).eq("Theme_ID", theme_id).execute()
        return Theme(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_theme(theme_id: int) -> Optional[Theme]:
    """Deletes a theme from the database."""
    try:
        response = supabase.table("Themes").delete().eq("Theme_ID", theme_id).execute()
        return Theme(**response.data[0]) if response.data else None
    except APIError as e:
        raise e