# routers/bookeo.py
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
import requests

# Assume your BookeoAPI class and helper functions are importable
from backend.config.bookeo import BookeoAPI, create_customer_data, create_participants_data, create_payment_data


router = APIRouter(prefix="/bookeo", tags=["bookeo"])

def get_bookeo_client() -> BookeoAPI:
    # Optionally make this a cached singleton if desired
    return BookeoAPI()

# --------- Schemas ---------
class AvailabilityQuery(BaseModel):
    start_time: str = Field(..., description="ISO time, e.g. 2025-10-15T00:00:00-00:00")
    end_time: str = Field(..., description="ISO time, e.g. 2025-10-16T00:00:00-00:00")
    product_id: Optional[str] = None
    adults: int = 1
    children: int = 0
    slot_type: str = "fixed"
    lang: str = "en-US"

class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None

class CustomerLookupResponse(BaseModel):
    exists: bool
    customer: Optional[Dict[str, Any]] = None

class BookingHoldCreate(BaseModel):
    event_id: str
    product_id: str
    customer_id: str
    adults: int = 1
    children: int = 0
    lang: str = "en-US"

class PaymentItem(BaseModel):
    amount: str = "1400"
    currency: str = "INR"
    reason: str = "Initial payment"
    comment: str = ""
    payment_method: str = "creditCard"

class BookingCreate(BaseModel):
    event_id: str
    product_id: str
    customer_id:str
    adults: int = 1
    children: int = 0
    previous_hold_id: Optional[str] = None
    initial_payments: Optional[List[PaymentItem]] = None
    notify_users: bool = True
    notify_customer: bool = True
    lang: str = "en-US"

# --------- Endpoints ---------

@router.get("/products")
def get_products(bookeo: BookeoAPI = Depends(get_bookeo_client)):
    try:
        return bookeo.get_products()
    except requests.RequestException as e:
        status = getattr(getattr(e, "response", None), "status_code", 502)
        raise HTTPException(status_code=status, detail="Failed to fetch products")

@router.get("/availability")
def get_availability(
    start_time: str = Query(..., description="ISO time, e.g. 2025-10-15T00:00:00-00:00"),
    end_time: str = Query(..., description="ISO time, e.g. 2025-10-16T00:00:00-00:00"),
    product_id: Optional[str] = None,
    adults: int = 1,
    children: int = 0,
    slot_type: str = "fixed",
    lang: str = "en-US",
    bookeo: BookeoAPI = Depends(get_bookeo_client),
):
    try:
        # Use matchingslots when participant categories are specified
        participants = create_participants_data(adults=adults, children=children)
        if (adults or children) and product_id:
            return bookeo.get_matching_slots(
                start_time=start_time,
                end_time=end_time,
                product_id=product_id,
                participants=participants,
                lang=lang,
            )
        # Fallback to generic slots (no per-category counts)
        return bookeo.get_available_slots(
            start_time=start_time,
            end_time=end_time,
            product_id=product_id,
            slot_type=slot_type,
            lang=lang,
        )
    except requests.RequestException as e:
        status = getattr(getattr(e, "response", None), "status_code", 502)
        raise HTTPException(status_code=status, detail="Failed to fetch availability")

@router.get("/customers/lookup", response_model=CustomerLookupResponse)
def lookup_customer(
    firstName: str | None = Query(None, description="Customer first name"),
    lastName: str | None = Query(None, description="Customer last name"),
    email: EmailStr | None = Query(None, description="Customer email"),
    # Pagination (Bookeo naming)
    items_per_page: int = Query(1, ge=1, le=100, alias="itemsPerPage"),
    page_number: int = Query(1, ge=1, alias="pageNumber"),
    page_navigation_token: str | None = Query(None, alias="pageNavigationToken"),
    bookeo: BookeoAPI = Depends(get_bookeo_client),
):
    try:
        # If continuing pagination, only send token + pageNumber
        if page_navigation_token:
            params = {
                "pageNavigationToken": page_navigation_token,
                "pageNumber": page_number,
            }
        else:
            params = {
                "itemsPerPage": items_per_page,
                "pageNumber": page_number,
            }

            # Build search strictly via searchField/searchText
            if email:
                params["searchField"] = "emailAddress"
                params["searchText"] = str(email)
            elif firstName and lastName:
                params["searchField"] = "name"
                params["searchText"] = f"{firstName} {lastName}"
            elif firstName:
                params["searchField"] = "firstName"
                params["searchText"] = firstName
            elif lastName:
                params["searchField"] = "lastName"
                params["searchText"] = lastName
            # If none provided, Bookeo returns first page of all customers

        resp = bookeo._make_request("GET", "/customers", params=params)
        data = resp.get("data", [])
        if data:
            return {"exists": True, "customer": data[0]}
        return {"exists": False, "customer": None}

    except requests.RequestException as e:
        status = getattr(getattr(e, "response", None), "status_code", 502)
        raise HTTPException(status_code=status, detail="Failed to search customers")



@router.post("/customers")
def create_customer( payload:CustomerCreate ,bookeo: BookeoAPI = Depends(get_bookeo_client)):
    try:
        customer = create_customer_data(
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            phone=payload.phone
        )

        return bookeo.create_customer(customer)
    except requests.RequestException as e:
        status = getattr(getattr(e, "response", None), "status_code", 502)
        raise HTTPException(status_code=status, detail="Failed to create customer")

@router.post("/holds")
def create_hold(payload: BookingHoldCreate, bookeo: BookeoAPI = Depends(get_bookeo_client)):
    try:
        participants = create_participants_data(adults=payload.adults, children=payload.children)
        return bookeo.create_booking_hold(
            event_id=payload.event_id,
            customer_id=payload.customer_id,
            participants=participants,
            product_id=payload.product_id,
            lang=payload.lang,
        )
    except requests.RequestException as e:
        status = getattr(getattr(e, "response", None), "status_code", 502)
        raise HTTPException(status_code=status, detail="Failed to create booking hold")

@router.post("/bookings")
def create_booking(payload: BookingCreate, bookeo: BookeoAPI = Depends(get_bookeo_client)):
    try:
        participants = create_participants_data(adults=payload.adults, children=payload.children)
        initial_payments = None
        if payload.initial_payments:
            initial_payments = [
                create_payment_data(
                    amount=p.amount,
                    currency=p.currency,
                    reason=p.reason,
                    comment=p.comment,
                    payment_method=p.payment_method,
                )
                for p in payload.initial_payments
            ]
        return bookeo.create_booking(
            event_id=payload.event_id,
            customer_id=payload.customer_id,
            participants=participants,
            product_id=payload.product_id,
            previous_hold_id=payload.previous_hold_id,
            initial_payments=initial_payments,
            notify_users=payload.notify_users,
            notify_customer=payload.notify_customer,
            lang=payload.lang,
        )
    except requests.RequestException as e:
        status = getattr(getattr(e, "response", None), "status_code", 502)
        raise HTTPException(status_code=status, detail="Failed to create booking")

@router.get("/bookings/{booking_id}")
def get_booking(booking_id: str, expand: bool = False, lang: str = "en-US", bookeo: BookeoAPI = Depends(get_bookeo_client)):
    try:
        return bookeo.get_booking(booking_id=booking_id, expand=expand, lang=lang)
    except requests.RequestException as e:
        status = getattr(getattr(e, "response", None), "status_code", 502)
        raise HTTPException(status_code=status, detail="Failed to retrieve booking")

@router.delete("/bookings/{booking_id}")
def cancel_booking(booking_id: str, notify_customer: bool = True, lang: str = "en-US", bookeo: BookeoAPI = Depends(get_bookeo_client)):
    try:
        return bookeo.cancel_booking(booking_id=booking_id, notify_customer=notify_customer, lang=lang)
    except requests.RequestException as e:
        status = getattr(getattr(e, "response", None), "status_code", 502)
        raise HTTPException(status_code=status, detail="Failed to cancel booking")
