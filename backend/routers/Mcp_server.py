# app/mcp_server.py

from fastapi import FastAPI, APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from backend.config.supabase_client import supabase  # ensure your client is configured
from backend.models.booking_model import BookingCreate



router = APIRouter(
    prefix="/MCP_server",
    tags=["MCP_server"]
)

# Import service functions
from backend.services.booking_service import (
    create_booking,
    get_booking_by_id,
    get_all_bookings,
    update_booking,
    delete_booking,
)
from backend.services.customer_service import (
    create_customer,
    get_customer_by_id,
    get_all_customers,
    update_customer,
    delete_customer,
)
from backend.services.lead_service import (
    create_lead,
    get_lead_by_id,
    get_all_leads,
    update_lead,
    delete_lead,
)
from backend.services.event_service import (
    create_event,
    get_event_by_id,
    get_all_events,
    update_event,
    delete_event,
)
from backend.services.payment_service import (
    create_payment,
    get_payment_by_id,
    get_all_payments,
    update_payment,
    delete_payment,
)
from backend.services.theme_service import get_all_themes, get_theme_by_id
from backend.services.slot_service import get_all_slots, get_slot_by_id

# Optional DB dependency placeholder
def get_db():
    # If your services require a DB session, yield it here.
    yield supabase


class MCPRequest(BaseModel):
    method: str                   # "tools/list" or "tools/call"
    params: Dict[str, Any]
    id: Optional[str]

class MCPResponse(BaseModel):
    result: Any = None
    error: Optional[Dict[str, Any]] = None
    id: Optional[str]

router = APIRouter()

@router.post("/mcp", response_model=MCPResponse)
async def mcp_handler(req: MCPRequest, db=Depends(get_db)):
    try:
        if req.method == "tools/list":
            tools: List[Dict[str, Any]] = []

            # Bookings
            tools += [
                {"name": "get_booking_by_id", "description": "Get a booking by ID", "inputSchema": {"booking_id": "int"}},
                {"name": "get_all_bookings",  "description": "List all bookings",   "inputSchema": {}},
                {"name": "create_booking",    "description": "Create a booking",    "inputSchema": BookingCreate.model_json_schema()},
                {"name": "update_booking",    "description": "Update a booking",    "inputSchema": {"booking_id": "int", "data": "object"}},
                {"name": "delete_booking",    "description": "Delete a booking",    "inputSchema": {"booking_id": "int"}},
            ]

            # Customers
            tools += [
                {"name": "get_customer_by_id", "description": "Get a customer by ID", "inputSchema": {"customer_id": "int"}},
                {"name": "get_all_customers",  "description": "List all customers",   "inputSchema": {}},
                {"name": "create_customer",    "description": "Create a customer",    "inputSchema": {"data": "object"}},
                {"name": "update_customer",    "description": "Update a customer",    "inputSchema": {"customer_id": "int", "data": "object"}},
                {"name": "delete_customer",    "description": "Delete a customer",    "inputSchema": {"customer_id": "int"}},
            ]

            # Leads
            tools += [
                {"name": "get_lead_by_id", "description": "Get a lead by ID", "inputSchema": {"lead_id": "int"}},
                {"name": "get_all_leads",  "description": "List all leads",   "inputSchema": {}},
                {"name": "create_lead",    "description": "Create a lead",    "inputSchema": {"data": "object"}},
                {"name": "update_lead",    "description": "Update a lead",    "inputSchema": {"lead_id": "int", "data": "object"}},
                {"name": "delete_lead",    "description": "Delete a lead",    "inputSchema": {"lead_id": "int"}},
            ]

            # Events
            tools += [
                {"name": "get_event_by_id", "description": "Get an event by ID", "inputSchema": {"event_id": "int"}},
                {"name": "get_all_events",  "description": "List all events",    "inputSchema": {}},
                {"name": "create_event",    "description": "Create an event",    "inputSchema": {"data": "object"}},
                {"name": "update_event",    "description": "Update an event",    "inputSchema": {"event_id": "int", "data": "object"}},
                {"name": "delete_event",    "description": "Delete an event",    "inputSchema": {"event_id": "int"}},
            ]

            # Payments
            tools += [
                {"name": "get_payment_by_id", "description": "Get a payment by ID", "inputSchema": {"payment_id": "int"}},
                {"name": "get_all_payments",  "description": "List all payments",    "inputSchema": {}},
                {"name": "create_payment",    "description": "Create a payment",     "inputSchema": {"data": "object"}},
                {"name": "update_payment",    "description": "Update a payment",     "inputSchema": {"payment_id": "int", "data": "object"}},
                {"name": "delete_payment",    "description": "Delete a payment",     "inputSchema": {"payment_id": "int"}},
            ]

            # Themes (read-only)
            tools += [
                {"name": "get_all_themes",   "description": "List all themes",   "inputSchema": {}},
                {"name": "get_theme_by_id",  "description": "Get theme by ID",   "inputSchema": {"theme_id": "int"}},
            ]

            # Slots (read-only)
            tools += [
                {"name": "get_all_slots",    "description": "List all slots",    "inputSchema": {}},
                {"name": "get_slot_by_id",   "description": "Get slot by ID",    "inputSchema": {"slot_id": "int"}},
            ]

            return MCPResponse(result={"tools": tools}, id=req.id)

        elif req.method == "tools/call":
            name = req.params.get("name")
            args = req.params.get("arguments", {})

            # Dispatch map
            dispatch = {
                # Bookings
                "get_booking_by_id": lambda: get_booking_by_id(args["booking_id"]),
                "j":  lambda: get_all_bookings(),
                "create_booking":    lambda: create_booking(args["data"]),
                "update_booking":    lambda: update_booking(args["booking_id"], args["data"]),
                "delete_booking":    lambda: delete_booking(args["booking_id"]),

                # Customers
                "get_customer_by_id": lambda: get_customer_by_id(args["customer_id"]),
                "get_all_customers":  lambda: get_all_customers(),
                "create_customer":    lambda: create_customer(args["data"]),
                "update_customer":    lambda: update_customer(args["customer_id"], args["data"]),
                "delete_customer":    lambda: delete_customer(args["customer_id"]),

                # Leads
                "get_lead_by_id": lambda: get_lead_by_id(args["lead_id"]),
                "get_all_leads":  lambda: get_all_leads(),
                "create_lead":    lambda: create_lead(args["data"]),
                "update_lead":    lambda: update_lead(args["lead_id"], args["data"]),
                "delete_lead":    lambda: delete_lead(args["lead_id"]),

                # Events
                "get_event_by_id": lambda: get_event_by_id(args["event_id"]),
                "get_all_events":  lambda: get_all_events(),
                "create_event":    lambda: create_event(args["data"]),
                "update_event":    lambda: update_event(args["event_id"], args["data"]),
                "delete_event":    lambda: delete_event(args["event_id"]),

                # Payments
                "get_payment_by_id": lambda: get_payment_by_id(args["payment_id"]),
                "get_all_payments":  lambda: get_all_payments(),
                "create_payment":    lambda: create_payment(args["data"]),
                "update_payment":    lambda: update_payment(args["payment_id"], args["data"]),
                "delete_payment":    lambda: delete_payment(args["payment_id"]),

                # Themes
                "get_all_themes":   lambda: get_all_themes(),
                "get_theme_by_id":  lambda: get_theme_by_id(args["theme_id"]),

                # Slots
                "get_all_slots":    lambda: get_all_slots(),
                "get_slot_by_id":   lambda: get_slot_by_id(args["slot_id"]),
            }

            if name not in dispatch:
                raise HTTPException(status_code=400, detail=f"Unknown tool: {name}")

            result = dispatch[name]()
            return MCPResponse(result=result, id=req.id)

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported method: {req.method}")

    except Exception as e:
        return MCPResponse(error={"message": str(e)}, id=req.id)
