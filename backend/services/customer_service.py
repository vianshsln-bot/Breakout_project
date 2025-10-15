from typing import List, Optional, Dict, Any
from postgrest import APIResponse
from datetime import datetime
from backend.config.supabase_client import supabase
from backend.models.customer_model import CustomerCreate, CustomerUpdate

def create_customer(customer: CustomerCreate) -> Dict[str, Any]:
    customer_dict = customer.model_dump(by_alias=True)
    response: APIResponse = supabase.table("customers").insert(customer_dict).execute()
    if response.data:
        return response.data[0]
    raise Exception("Could not create customer.")

def get_customer_by_id(customer_id: str) -> Optional[Dict[str, Any]]:
    response: APIResponse = supabase.table("customers").select("*").eq("customer_id", customer_id).single().execute()
    if response.data:
        return response.data
    return None

def get_all_customers(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    response: APIResponse = supabase.table("customers").select("*").range(skip, skip + limit - 1).execute()
    if response.data:
        return response.data
    return []

def update_customer(customer_id: str, customer_update: CustomerUpdate) -> Optional[Dict[str, Any]]:
    update_data = customer_update.model_dump(exclude_unset=True)
    response: APIResponse = supabase.table("customers").update(update_data).eq("customer_id", customer_id).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None

def delete_customer(customer_id: str) -> bool:
    response: APIResponse = supabase.table("customers").delete().eq("customer_id", customer_id).execute()
    return response.status_code == 204
