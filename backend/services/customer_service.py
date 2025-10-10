from typing import List, Optional , Dict, Any
from postgrest import APIError, APIResponse
from datetime import datetime, timezone

from backend.config.supabase_client import supabase
from backend.models.customer_model import Customer, CustomerCreate, CustomerUpdate


def create_customer(customer: CustomerCreate) -> Dict[str, Any]:
    """Creates a new customer record in the database."""
    # model_dump(by_alias=True) ensures the dictionary keys match the database column names
    customer_dict = customer.model_dump(by_alias=True)
    response: APIResponse = supabase.table("customers").insert(customer_dict).execute()
    
    if response.data:
        return response.data[0]
    # Handle potential errors, e.g., raise an exception
    raise Exception("Could not create customer.") # Or a custom exception

def get_customer_by_id(customer_id: int) -> Dict[str, Any] | None:
    """Retrieves a single customer by their ID."""
    response: APIResponse = supabase.table("customers").select("*").eq("customer_id", customer_id).single().execute()
    return response.data if response.data else None



def get_customer_by_identifier(identifier: str) -> Dict[str, Any] | None:
    """
    Retrieves a single customer by their email OR phone number.

    Args:
        identifier: The email or phone number to search for.

    Returns:
        A dictionary with the customer's data or None if not found.
    """
    response: APIResponse = (
        supabase.table("customers")
        .select("*")
        .or_(f"email.eq.{identifier},phone_number.eq.{identifier}")
        # .single() <-- REMOVE THIS LINE
        .execute()
    )
    
    # The result (response.data) is now a list.
    # If the list is not empty, return the first item.
    # Otherwise, return None.
    return response.data[0] if response.data else None
    
def get_all_customers(skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
    """Retrieves a list of all customers with pagination."""
    response: APIResponse = supabase.table("customers").select("*").range(skip, skip + limit - 1).execute()
    return response.data if response.data else []

def update_customer(customer_id: int, customer_update: CustomerUpdate) -> Dict[str, Any] | None:
    """Updates an existing customer's information."""
    # exclude_unset=True ensures we only update the fields that were provided
    update_data = customer_update.model_dump(by_alias=True, exclude_unset=True)
    
    if not update_data:
        # If no data was sent, just fetch the existing record
        return get_customer_by_id(customer_id)
        
    response: APIResponse = supabase.table("customers").update(update_data).eq("customer_id", customer_id).execute()
    return response.data[0] if response.data else None

def delete_customer(customer_id: int) -> Dict[str, Any] | None:
    """Deletes a customer record from the database."""
    response: APIResponse = supabase.table("customers").delete().eq("customer_id", customer_id).execute()
    return response.data[0] if response.data else None
