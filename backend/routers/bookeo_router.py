# routers/bookeo.py
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
import requests
import time
from datetime import datetime, timedelta,timezone
from backend.config.supabase_client import supabase

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
    amount: str = "100"
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









# Refresh themes from Bookeo
@router.post("/themes/refresh")
def refresh_themes(bookeo: BookeoAPI = Depends(get_bookeo_client)):
    page_token = None

    while True:
        params = {}
        if page_token:
            params["pageNavigationToken"] = page_token

        try:
            payload = bookeo._make_request("GET", "/settings/products", params=params)
        except requests.RequestException:
            raise HTTPException(status_code=502, detail="Bookeo API request failed")

        for theme in payload.get("data", []):
            duration_iso = theme.get("duration", {})
            duration_minutes = parse_iso_duration_to_minutes(duration_iso)

            booking_limits = theme.get("bookingLimits", [])
            # print(booking_limits)
            min_limit = booking_limits[0]['min']
            max_limit = booking_limits[0]['max']

            row = {
                "theme_id": theme["productId"],
                "name": theme.get("name", ""),
                "description": theme.get("description"),
                "duration_minutes": duration_minutes,
                "booking_limit_min": min_limit,
                "booking_limit_max": max_limit,
            }
            result = supabase.table("themes").upsert(row, on_conflict="theme_id").execute()
            if getattr(result, "status_code", 200) >= 300:
                raise HTTPException(status_code=500, detail="Supabase upsert failed")

        info = payload.get("info", {})
        token = info.get("pageNavigationToken")
        if not token or info.get("currentPage", 0) >= info.get("totalPages", 0):
            break
        page_token = token

    return {"status": "completed"}


# Helper to parse ISO 8601 duration (PTxxM) to minutes (int)
def parse_iso_duration_to_minutes(duration_iso) -> int:
    # Example expected format: "PT90M"
    try:
        return duration_iso['hours']*60+duration_iso['minutes']
    except Exception:
        pass
    return 0



@router.post("/customers/refresh")
def refresh_customers(bookeo: BookeoAPI = Depends(BookeoAPI)):
    # 1. Get last sync timestamp from Supabase
    resp = supabase.table("customers") \
        .select("customer_since") \
        .order("customer_since", desc=True) \
        .limit(1) \
        .execute()

    if getattr(resp, "status_code", 200) >= 300:
        raise HTTPException(status_code=500, detail="Failed to query Supabase")

    last_sync_str = resp.data[0]["customer_since"] if resp.data else "1970-01-01T00:00:00+00:00"
    last_sync = datetime.fromisoformat(last_sync_str)
    if last_sync.tzinfo is None:
        last_sync = last_sync.replace(tzinfo=timezone.utc)

    page_token = None
    while True:
        params = {}
        if page_token:
            params["pageNavigationToken"] = page_token
        else:
            params["createdTime"] = last_sync.isoformat()

        try:
            payload = bookeo._make_request("GET", "/customers", params=params)
        except requests.RequestException as e:
            raise HTTPException(status_code=502, detail=f"Bookeo API request failed: {e}")

        customers_to_upsert = []
        stop_sync = False

        for cust in payload.get("data", []):
            created = datetime.fromisoformat(cust["creationTime"])
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)

            if created <= last_sync:
                stop_sync = True
                break

            phone_numbers = cust.get("phoneNumbers", [])
            phone_number = phone_numbers[0].get("number") if phone_numbers else None

            row = {
                "customer_id": cust["id"],
                "name": f"{cust.get('firstName', '')} {cust.get('lastName', '')}".strip(),
                "email": cust.get("emailAddress"),
                "phone_number": phone_number,
                "customer_since": cust["creationTime"],
            }
            customers_to_upsert.append(row)

        if customers_to_upsert:
            upsert_resp = supabase.table("customers") \
                .upsert(customers_to_upsert, on_conflict="customer_id") \
                .execute()
            if getattr(upsert_resp, "status_code", 200) >= 300:
                raise HTTPException(status_code=500, detail="Supabase upsert failed")

        if stop_sync:
            return {"status": "completed", "detail": "Sync complete. Reached previously synced customers."}

        info = payload.get("info", {})
        token = info.get("pageNavigationToken")
        if not token:
            break
        page_token = token

    return {"status": "completed", "detail": "Synced all pages."}

def format_iso_for_api(dt: datetime) -> str:
    """Formats a datetime object into an ISO string without microseconds, ending in 'Z'."""
    return dt.replace(microsecond=0).isoformat().replace('+00:00', 'Z')

@router.post("/bookings/refresh")
def refresh_bookings(bookeo: BookeoAPI = Depends(get_bookeo_client)):
    """
    Refresh bookings from Bookeo incrementally using last updated time range filter.
    Handles pagination within multiple time windows to sync all new data.
    """
    # 1. Get the last synced time from Supabase
    try:
        resp = supabase.table("bookings") \
            .select("last_change_time") \
            .order("last_change_time", desc=True) \
            .limit(1) \
            .execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query Supabase: {e}")

    last_sync_str = resp.data[0]["last_change_time"] if resp.data and resp.data[0].get("last_change_time") else None

    now_utc = datetime.now(timezone.utc)
    if last_sync_str:
        # --- FIX 1: Make sure to handle both aware and naive timestamps correctly ---
        parsed_dt = datetime.fromisoformat(last_sync_str.replace("Z", "+00:00"))
        if parsed_dt.tzinfo is None:
            last_sync = parsed_dt.replace(tzinfo=timezone.utc)
        else:
            last_sync = parsed_dt
    else:
        # If no sync time is found, default to fetching the last 31 days
        last_sync = now_utc - timedelta(days=31)

    all_bookings = []

    # --- FIX 2: Corrected loop logic to handle multiple time windows ---
    # The outer loop advances the time window.
    while last_sync < now_utc:
        # Calculate the end of the current 31-day chunk, ensuring it doesn't go into the future.
        end_time = min(last_sync + timedelta(days=31), now_utc)

        page_token = None
        # The inner loop handles pagination for the current time window.
        while True:
            params = {
                # --- FIX 3: Format timestamps correctly for the API ---
                "lastUpdatedStartTime": format_iso_for_api(last_sync),
                "lastUpdatedEndTime": format_iso_for_api(end_time)
            }
            if page_token:
                params["pageNavigationToken"] = page_token

            response = bookeo.get_bookings(**params)
            data = response.get("data", [])
            all_bookings.extend(data)

            info = response.get("info", {})
            page_token = info.get("pageNavigationToken")
            if not page_token:
                # No more pages in this time window, break the inner loop
                break
        
        # Advance the start time for the next 31-day chunk
        last_sync = end_time

    if not all_bookings:
        return {"status": "completed", "synced": 0, "detail": "No new bookings to sync."}

    # Upsert all collected bookings into Supabase
    formatted_bookings = [
        {
            "booking_id": booking["bookingNumber"],
            "event_id": booking["eventId"],
            "theme_id": booking["productId"],
            "start_time": booking["startTime"],
            "end_time": booking.get("endTime"),
            "customer_id": booking["customerId"],
            "status": "canceled" if booking.get("canceled", False) else "active",
            "creation_time": booking["creationTime"],
            "last_change_time": booking.get("lastChangeTime")
        } for booking in all_bookings
    ]

    try:
        supabase.table("bookings") \
            .upsert(formatted_bookings, on_conflict="booking_id") \
            .execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase upsert failed: {e}")

    return {"status": "completed", "synced": len(formatted_bookings)}