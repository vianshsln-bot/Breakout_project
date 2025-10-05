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
def read_all_payments(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all payments."""
    try:
        return payment_service.get_all_payments(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{payment_id}", response_model=Payment)
def read_payment_by_id(payment_id: int):
    """Retrieve a specific payment by its ID."""
    payment = payment_service.get_payment_by_id(payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment

@router.patch("/{payment_id}", response_model=Payment)
def update_existing_payment(payment_id: int, payment_data: PaymentUpdate):
    """Update an existing payment's details."""
    try:
        updated_payment = payment_service.update_payment(payment_id, payment_data)
        if not updated_payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
        return updated_payment
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{payment_id}", response_model=Payment)
def delete_existing_payment(payment_id: int):
    """Delete a payment record."""
    deleted_payment = payment_service.delete_payment(payment_id)
    if not deleted_payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return deleted_payment