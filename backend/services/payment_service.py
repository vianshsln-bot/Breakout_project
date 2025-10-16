# backend/services/payment_service.py

from typing import List, Optional
from postgrest import APIError
from backend.config.supabase_client import supabase
from backend.models.payment_model import PaymentCreate, PaymentUpdate, Payment

payment_table = "payment"
def create_payment(data: PaymentCreate) -> Payment:
    payload = data.model_dump(mode="json")
    resp = supabase.table(payment_table).insert(payload).execute()
    if getattr(resp, "status_code", 200) >= 300:
        raise APIError(resp.get("error", {}))
    row = (resp.data or [])[0]
    return Payment(**row)

def get_all_payments(skip: int = 0, limit: int = 100) -> List[Payment]:
    resp = (
        supabase
        .table(payment_table)
        .select("*")
        .order("creation_time", desc=True)
        .range(skip, skip + limit - 1)
        .execute()
    )
    if getattr(resp, "status_code", 200) >= 300:
        raise APIError(resp.get("error", {}))
    return [Payment(**row) for row in resp.data or []]

def get_payment_by_id(payment_id: str) -> Optional[Payment]:
    resp = (
        supabase
        .table(payment_table)
        .select("*")
        .eq("payment_id", payment_id)
        .single()
        .execute()
    )
    if getattr(resp, "status_code", 200) >= 300:
        if resp.status_code == 406:
            return None
        raise APIError(resp.get("error", {}))
    return Payment(**(resp.data or {}))

def update_payment(payment_id: str, data: PaymentUpdate) -> Optional[Payment]:
    update_fields = data.model_dump(exclude_unset=True, mode="json")
    if not update_fields:
        return get_payment_by_id(payment_id)
    resp = (
        supabase
        .table(payment_table)
        .update(update_fields)
        .eq("payment_id", payment_id)
        .single()
        .execute()
    )
    if getattr(resp, "status_code", 200) >= 300:
        if resp.status_code == 406:
            return None
        raise APIError(resp.get("error", {}))
    return Payment(**(resp.data or {}))

def delete_payment(payment_id: str) -> Optional[Payment]:
    resp = (
        supabase
        .table(payment_table)
        .delete()
        .eq("payment_id", payment_id)
        .single()
        .execute()
    )
    if getattr(resp, "status_code", 200) >= 300:
        if resp.status_code == 406:
            return None
        raise APIError(resp.get("error", {}))
    return Payment(**(resp.data or {}))


