from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.payment_model import Payment, PaymentCreate, PaymentUpdate, PaymentStatus

def create_payment(payment_data: PaymentCreate) -> Payment:
    """Creates a new payment record with a 'pending' status."""
    try:
        payment_dict = payment_data.model_dump()
        # Set the initial status automatically
        payment_dict["Payment_status"] = PaymentStatus.PENDING.value
        response = supabase.table("Payment").insert(payment_dict).execute()
        return Payment(**response.data[0])
    except APIError as e:
        raise e

def get_all_payments(skip: int = 0, limit: int = 100) -> List[Payment]:
    """Retrieves a list of all payments."""
    try:
        response = supabase.table("Payment").select("*").range(skip, skip + limit - 1).execute()
        return [Payment(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_payment_by_id(payment_id: int) -> Optional[Payment]:
    """Retrieves a single payment by its ID."""
    try:
        response = supabase.table("Payment").select("*").eq("Payment_ID", payment_id).single().execute()
        return Payment(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching payment by ID {payment_id}: {e.message}")
        return None

def update_payment(payment_id: int, payment_data: PaymentUpdate) -> Optional[Payment]:
    """Updates an existing payment's record."""
    try:
        update_dict = payment_data.model_dump(exclude_unset=True)
        if not update_dict:
            return get_payment_by_id(payment_id)
        
        response = supabase.table("Payment").update(update_dict).eq("Payment_ID", payment_id).execute()
        return Payment(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_payment(payment_id: int) -> Optional[Payment]:
    """Deletes a payment from the database."""
    try:
        response = supabase.table("Payment").delete().eq("Payment_ID", payment_id).execute()
        return Payment(**response.data[0]) if response.data else None
    except APIError as e:
        raise e