from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import booking_service
from backend.models.booking_model import Booking, BookingCreate, BookingUpdate

router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)

@router.post("/", response_model=Booking, status_code=status.HTTP_201_CREATED)
def create_new_booking(booking_data: BookingCreate):
    try:
        return booking_service.create_booking(booking_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Booking])
def read_all_bookings(skip: int = 0, limit: int = Query(default=100, lte=200)):
    try:
        return booking_service.get_all_bookings(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/customer/{customer_id}", response_model=List[Booking])
def read_bookings_for_customer(customer_id: str):
    try:
        return booking_service.get_bookings_by_customer_id(customer_id)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{booking_id}", response_model=Booking)
def read_booking_by_id(booking_id: str):
    booking = booking_service.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking

@router.patch("/{booking_id}", response_model=Booking)
def update_existing_booking(booking_id: str, booking_data: BookingUpdate):
    try:
        updated = booking_service.update_booking(booking_id, booking_data)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        return updated
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{booking_id}", response_model=Booking)
def delete_existing_booking(booking_id: str):
    deleted = booking_service.delete_booking(booking_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return deleted
