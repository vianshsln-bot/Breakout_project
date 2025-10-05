from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.call_analysis_model import CallAnalysis, CallAnalysisCreate, CallAnalysisUpdate

def create_call_analysis(analysis_data: CallAnalysisCreate) -> CallAnalysis:
    """Creates a new call analysis record."""
    try:
        analysis_dict = analysis_data.model_dump()
        response = supabase.table("Call_analysis").insert(analysis_dict).execute()
        return CallAnalysis(**response.data[0])
    except APIError as e:
        raise e

def get_all_call_analyses() -> List[CallAnalysis]:
    """Retrieves a list of all call analyses."""
    try:
        response = supabase.table("Call_analysis").select("*").execute()
        return [CallAnalysis(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_call_analysis_by_id(analysis_id: int) -> Optional[CallAnalysis]:
    """Retrieves a single call analysis by its ID."""
    try:
        response = supabase.table("Call_analysis").select("*").eq("analysis_id", analysis_id).single().execute()
        return CallAnalysis(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching call analysis by ID {analysis_id}: {e.message}")
        return None

def get_call_analysis_by_conv_id(conv_id: str) -> Optional[CallAnalysis]:
    """Retrieves a single call analysis by its conversation ID."""
    try:
        # Assuming conv_id is unique per analysis
        response = supabase.table("Call_analysis").select("*").eq("conv_id", conv_id).maybe_single().execute()
        return CallAnalysis(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching call analysis by conv_id {conv_id}: {e.message}")
        return None


def update_call_analysis(analysis_id: int, analysis_data: CallAnalysisUpdate) -> Optional[CallAnalysis]:
    """Updates an existing call analysis record."""
    try:
        update_dict = analysis_data.model_dump(exclude_unset=True)
        if not update_dict:
            return get_call_analysis_by_id(analysis_id)
        
        response = supabase.table("Call_analysis").update(update_dict).eq("analysis_id", analysis_id).execute()
        return CallAnalysis(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_call_analysis(analysis_id: int) -> Optional[CallAnalysis]:
    """Deletes a call analysis from the database."""
    try:
        response = supabase.table("Call_analysis").delete().eq("analysis_id", analysis_id).execute()
        return CallAnalysis(**response.data[0]) if response.data else None
    except APIError as e:
        raise e