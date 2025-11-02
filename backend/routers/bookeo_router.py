# routers/bookeo.py
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
import requests
import time
from datetime import datetime, timedelta,timezone
from backend.config.payu_client import PaymentLinkRequest
from backend.config.supabase_client import supabase

# Assume your BookeoAPI class and helper functions are importable
from backend.config.bookeo import BookeoAPI, create_customer_data, create_participants_data, create_payment_data

import re

router = APIRouter(prefix="/bookeo", tags=["bookeo"])

def get_bookeo_client() -> BookeoAPI:
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
    previous_hold_id: Optional[str] = None
    lang: str = "en-US"
    payment_info: PaymentLinkRequest = None

class PaymentItem(BaseModel):
    amount: str = "100"
    currency: str = "INR"
    reason: str = "Initial payment"
    comment: str = ""
    payment_method: str = "creditCard"

class BookingCreate(BaseModel):
    product_id: str
    event_id: str
    adults: int
    children: int
    customer_id: str
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
        return bookeo.create_booking_hold_and_payment_link(
            event_id=payload.event_id,
            customer_id=payload.customer_id,
            participants=participants,
            product_id=payload.product_id,
            lang=payload.lang,
            payment_link_request=payload.payment_info,
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
            participants=participants,
            customer_id=payload.customer_id,
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


@router.get("/customers/{customer_id}/bookings", response_model=Dict)
async def get_customer_bookings(
    customer_id: str,
    begin_date: Optional[str] = Query(None, description="Only bookings on or after this date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Only bookings on or before this date (YYYY-MM-DD)"),
    expand_participants: bool = Query(False, description="Include full participant details"),
    items_per_page: int = Query(50, le=100, description="Number of items per page (max 100)"),
    page_navigation_token: Optional[str] = Query(None, description="Token for page navigation"),
    page_number: int = Query(1, ge=1, description="Page number")
):
    """
    Retrieve a customer's bookings from Bookeo.
    
    - **customer_id**: The customer ID (required)
    - **begin_date**: Optional start date filter (YYYY-MM-DD)
    - **end_date**: Optional end date filter (YYYY-MM-DD)
    - **expand_participants**: Include full participant details
    - **items_per_page**: Results per page (max 100)
    - **page_navigation_token**: Token for pagination
    - **page_number**: Page number to retrieve
    """
    try:
        bookeo_client = BookeoAPI()
        
        result = bookeo_client.get_customer_bookings(
            customer_id=customer_id,
            begin_date=begin_date,
            end_date=end_date,
            expand_participants=expand_participants,
            items_per_page=items_per_page,
            page_navigation_token=page_navigation_token,
            page_number=page_number
        )
        
        if result.get("success"):
            return {
                "success": True,
                "data": result.get("data"),
                "message": f"Successfully retrieved bookings for customer {customer_id}"
            }
        else:
            raise HTTPException(
                status_code=result.get("httpStatus") or result.get("status") or 500,
                detail={
                    "message": result.get("message"),
                    "errorId": result.get("errorId"),
                    "source": result.get("source")
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "message": f"Failed to retrieve customer bookings: {str(e)}",
                "source": "get_customer_bookings_router"
            }
        )



from bs4 import BeautifulSoup
import html
def clean_description(raw_html):
    # Remove HTML tags safely
    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(separator=' ', strip=True)
    # Decode HTML entities (like &mdash;)
    text = html.unescape(text)
    return text



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
            # print(json.dumps(theme,indent=2))
            booking_limits = theme.get("bookingLimits", [])
            # print(booking_limits)
            min_limit = booking_limits[0]['min']
            max_limit = booking_limits[0]['max']

            row = {
                "theme_id": theme["productId"],
                "name": theme.get("name", ""),
                "description": clean_description(theme.get("description")),
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

    last_sync_str = resp.data[0]["customer_since"] if resp.data else "2000-01-01T00:00:00+00:00"
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
        # stop_sync = False
        # print("lastsync : ",last_sync)
        # for cust in payload.get("data"):
        #     print(cust["firstName"]+cust["lastName"] ,"          ",cust["creationTime"])
        # return {"status": "completed", "detail": f"Synced all pages. {payload.get("data")}"}
    
        for cust in payload.get("data", []):
            created = datetime.fromisoformat(cust["creationTime"])
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)

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

        # if stop_sync:
        #     return {"status": "completed", "detail": "Sync complete. Reached previously synced customers."}

        info = payload.get("info", {})
        token = info.get("pageNavigationToken")
        if not token:
            break
        page_token = token

    return {"status": "completed", "detail": f"Synced all pages.{len(customers_to_upsert)}"}

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
            .select("creation_time") \
            .order("creation_time", desc=True) \
            .limit(1) \
            .execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query Supabase: {e}")

    last_sync_str = resp.data[0]["creation_time"] if resp.data and resp.data[0].get("creation_time") else None

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

    # for booking in all_bookings:
    #     print(json.dumps(booking,indent=4))
    if not all_bookings:
        return {"status": "completed", "synced": 0, "detail": "No new bookings to sync."}

    formatted_bookings = [
    {
        "booking_id": booking["bookingNumber"],
        "event_id": booking["eventId"],
        "theme_id": booking["productId"],
        "start_time": booking["startTime"],
        "end_time": booking.get("endTime"),
        "customer_id": booking["customerId"],
        "status": "canceled" if booking.get("canceled", False) else "confirmed",
        "creation_time": booking["creationTime"],
        
        # --- Corrected participant parsing ---
        # Find the 'Cadults' entry, get its 'number', default to 0
        "adults": next(
            (item.get("number", 0) for item in booking.get("participants", {}).get("numbers", []) 
             if item.get("peopleCategoryId") == "Cadults"), 
            0  # Default value if 'Cadults' is not found
        ),
        
        # Find the 'Cchildren' entry, get its 'number', default to 0
        "children": next(
            (item.get("number", 0) for item in booking.get("participants", {}).get("numbers", []) 
             if item.get("peopleCategoryId") == "Cchildren"), # <-- Assumes 'Cchildren'
            0  # Default value
        ),
        
        # --- Corrected price parsing ---
        # Get nested amounts, default to "0", and convert to a number
        "total_gross": float(booking.get("price", {}).get("totalGross", {}).get("amount", "0")),
        "total_net": float(booking.get("price", {}).get("totalNet", {}).get("amount", "0")),
        "total_taxes": float(booking.get("price", {}).get("totalTTaxes", {}).get("amount", "0")),
        "total_paid": float(booking.get("price", {}).get("totalPaid", {}).get("amount", "0")),

        } for booking in all_bookings
    ]
    # print(formatted_bookings)
    try:
        supabase.table("bookings") \
            .upsert(formatted_bookings, on_conflict="booking_id") \
            .execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase upsert failed: {e}")
# 
    return {"status": "completed", "synced": len(formatted_bookings)}


@router.post("/payments/refresh")
def refresh_payments(
    bookeo: BookeoAPI = Depends(get_bookeo_client),
):
    """
    Fetch all payments from Bookeo and upsert into the payment table.
    Uses the last creation_time in Supabase as startTime and now as endTime.
    """
    try:
        resp = supabase.table("payment").select("creation_time").order("creation_time", desc=True).limit(1).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query Supabase: {e}")

    last_sync_str = resp.data[0]["creation_time"] if resp.data and resp.data[0].get("creation_time") else None

    now_utc = datetime.now(timezone.utc)

    if last_sync_str:
        parsed_dt = datetime.fromisoformat(last_sync_str.replace("Z", "+00:00"))
        last_sync = parsed_dt if parsed_dt.tzinfo else parsed_dt.replace(tzinfo=timezone.utc)
    else:
       last_sync = now_utc - timedelta(days=31)
    start_time = last_sync.astimezone(timezone.utc).isoformat(timespec='seconds')
    end_time = now_utc.astimezone(timezone.utc).isoformat(timespec='seconds')
    
    page_token = None
    total_synced = 0

    while True:
        params = {}
        if page_token:
            params["pageNavigationToken"] = page_token
        if start_time:
            params["startTime"] = start_time
        params["endTime"] = end_time
        print(params)
        try:
            payload = bookeo._make_request("GET", "/payments", params=params)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Bookeo API request failed: {str(e)}")

        for payment in payload.get("data", []):
            payment_id = payment.get("id")
            if not payment_id:
                continue

            amount_data = payment.get("amount", {})
            amount = float(amount_data.get("amount", 0))
            currency = amount_data.get("currency", "INR")
            method = payment.get("paymentMethod", "other")
            method_other = payment.get("paymentMethodOther")
            customer_id = payment.get("customerId")

            description = payment.get("description", "")
            booking_id = None
            if description:
                match = re.search(r'Booking\s+(\w+)', description, re.IGNORECASE)
                if match:
                    booking_id = match.group(1)

            creation_str = payment.get("creationTime")
            creation_time = None
            if creation_str:
                try:
                    creation_time = datetime.fromisoformat(creation_str.replace("Z", "+00:00"))
                except Exception:
                    pass

            received_str = payment.get("receivedTime")
            received_time = None
            if received_str:
                try:
                    received_time = datetime.fromisoformat(received_str.replace("Z", "+00:00"))
                except Exception:
                    pass

            reason = payment.get("reason")
            comment = payment.get("comment")
            agent = payment.get("agent")
            status = "completed"

            row = {
                "payment_id": payment_id,
                "customer_id": customer_id,
                "booking_id": booking_id,
                "payment_amount": amount,
                "currency": currency,
                "payment_method": method,
                "payment_method_other": method_other,
                "payment_status": status,
                "reason": reason,
                "comment": comment,
                "agent": agent,
                "creation_time": creation_time.isoformat(),
                "received_time": received_time.isoformat()
            }

            try:
                result = supabase.table("payment").upsert(row, on_conflict="payment_id").execute()
                if getattr(result, "status_code", 200) >= 300:
                    raise HTTPException(status_code=500, detail="Supabase upsert failed")
                total_synced += 1
            except Exception as e:
                print(f"Failed to upsert payment {payment_id}: {str(e)}")
                continue

        info = payload.get("info", {})
        token = info.get("pageNavigationToken")
        current_page = info.get("currentPage", 0)
        total_pages = info.get("totalPages", 0)

        if not token or current_page >= total_pages:
            break
        page_token = token

    return {"status": "completed", "total_synced": total_synced}
