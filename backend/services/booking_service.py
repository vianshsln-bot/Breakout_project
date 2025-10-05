from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.booking_model import Booking, BookingCreate, BookingUpdate, BookingStatus

def create_booking(booking_data: BookingCreate) -> Booking:
    """Creates a new booking record with a 'pending' status."""
    try:
        booking_dict = booking_data.model_dump(mode="json")
        # Set the initial status automatically
        booking_dict["Booking_status"] = BookingStatus.PENDING.value
        
        response = supabase.table("Booking").insert(booking_dict).execute()
        return Booking(**response.data[0])
    except APIError as e:
        raise e

def get_all_bookings(skip: int = 0, limit: int = 100) -> List[Booking]:
    """Retrieves a list of all bookings with pagination."""
    try:
        response = supabase.table("Booking").select("*").order("Booking_date", desc=True).range(skip, skip + limit - 1).execute()
        return [Booking(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_booking_by_id(booking_id: int) -> Optional[Booking]:
    """Retrieves a single booking by its ID."""
    try:
        response = supabase.table("Booking").select("*").eq("Booking_ID", booking_id).single().execute()
        return Booking(**response.data) if response.data else None
    except APIError as e:
        print(f"Error getting booking by ID {booking_id}: {e.message}")
        return None

def get_bookings_by_customer_id(customer_id: int) -> List[Booking]:
    """Retrieves all bookings for a specific customer."""
    try:
        response = supabase.table("Booking").select("*").eq("Customer_ID", customer_id).execute()
        return [Booking(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def update_booking(booking_id: int, booking_data: BookingUpdate) -> Optional[Booking]:
    """Updates an existing booking's record."""
    try:
        update_dict = booking_data.model_dump(exclude_unset=True)
        if not update_dict:
            return get_booking_by_id(booking_id)
        
        response = supabase.table("Booking").update(update_dict).eq("Booking_ID", booking_id).execute()
        return Booking(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_booking(booking_id: int) -> Optional[Booking]:
    """Deletes a booking from the database."""
    try:
        response = supabase.table("Booking").delete().eq("Booking_ID", booking_id).execute()
        return Booking(**response.data[0]) if response.data else None
    except APIError as e:
        raise e