# backend/routers/payment_router.py

from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import payment_service
from backend.models.payment_model import Payment, PaymentCreate, PaymentUpdate

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)

@router.post("/", response_model=Payment, status_code=status.HTTP_201_CREATED)
def create_new_payment(payment_data: PaymentCreate):
    """Create a new payment record."""
    try:
        return payment_service.create_payment(payment_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Payment])
def read_all_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=200)
):
    """Retrieve all payments."""
    try:
        return payment_service.get_all_payments(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{payment_id}", response_model=Payment)
def read_payment_by_id(payment_id: str):
    """Retrieve a specific payment by its ID."""
    try:
        payment = payment_service.get_payment_by_id(payment_id)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment

@router.patch("/{payment_id}", response_model=Payment)
def update_existing_payment(payment_id: str, payment_data: PaymentUpdate):
    """Update an existing payment's details."""
    try:
        updated = payment_service.update_payment(payment_id, payment_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return updated

@router.delete("/{payment_id}", response_model=Payment)
def delete_existing_payment(payment_id: str):
    """Delete a payment record."""
    try:
        deleted = payment_service.delete_payment(payment_id)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return deleted
