# FastAPI router for WATI v1 template operations. [web:2]
# Uses sendTemplateMessages with receivers and customParams. [web:2][web:7]
# Lists templates via getMessageTemplates. [web:6]
# Only Approved templates can be sent. [web:53]

from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from backend.config.wati import wati_client
# Assumes `wati_client` is available in the runtime (import or same module). [web:2]

router = APIRouter(prefix="/wati", tags=["wati"])  # Dedicated tag/namespace. [web:2]

# ----- Request Models ----- [web:2]

class SendByTemplateIdRequest(BaseModel):
    phone_number: str = Field(..., description="Recipient in E.164-like format")  # Keep '+' and digits only. [web:67]
    template_id: str = Field(..., description="Template ID as returned by getMessageTemplates")  # ID is resolved to name. [web:6]
    parameters: List[str] = Field(..., description="Ordered params matching template variables")  # param1..n in order. [web:7]
    broadcast_name: Optional[str] = Field(None, description="Optional broadcast name for WATI UI")  # Optional naming. [web:2]

class BookingSendRequest(BaseModel):
    phone_number: str = Field(..., description="Recipient in E.164-like format")  # Recommended for WhatsApp. [web:67]
    customer_name: str
    theme_name: str
    start_time: datetime  # ISO-8601 string parses to datetime. [web:6]
    participants: Dict[str, int] = Field(default_factory=dict)

class ReminderSendRequest(BaseModel):
    phone_number: str = Field(..., description="Recipient in E.164-like format")  # E.164-style improves deliverability. [web:67]
    timing_phrase: str = Field(..., description='e.g., "tomorrow" or "in 1 hour"')  # Move timing into a variable. [web:4]
    customer_name: str
    theme_name: str
    start_time: datetime
    participants: Dict[str, int] = Field(default_factory=dict)

# ----- Routes ----- [web:2]

@router.get("/templates")
def list_templates(
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=500),
    status_q: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """
    Fetch message templates so you can confirm exact name, status, and variable count. [web:6]
    """
    if not wati_client:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="WATI client not configured")  # Client must be initialized. [web:2]
    try:
        data = wati_client.get_templates(page=page, page_size=page_size, status=status_q, search=search)  # v1 list. [web:6]
        return data  # Raw pass-through of WATI list payload. [web:6]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed to fetch templates: {e}")  # Surface upstream errors. [web:6]


@router.post("/send/by-template-id")
def send_by_template_id(payload: SendByTemplateIdRequest) -> Dict[str, Any]:
    """
    Send a template by its ID by resolving to the template's exact name, then calling v1 bulk send. [web:6]
    """
    if not wati_client:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="WATI client not configured")  # Requires initialized client. [web:2]

    # Find template by id (first page with a high page size to reduce pagination). [web:6]
    try:
        page_size = 500  # Adjust if your tenant has more templates. [web:6]
        templates_resp = wati_client.get_templates(page=1, page_size=page_size, status="approved")  # Only Approved are usable. [web:53]
        records = templates_resp.get("data") or templates_resp.get("templates") or []  # Different tenants may label keys differently. [web:6]
        match = next((t for t in records if str(t.get("id")) == str(payload.template_id)), None)  # Simple id match. [web:6]
        if not match:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template ID not found in Approved list")  # Must be Approved. [web:53]
        template_name = match.get("name")
        if not template_name:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Template record missing name")  # Name is required to send. [web:2]
    except HTTPException:
        raise  # Preserve intended HTTP status codes. [web:6]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Failed resolving template id: {e}")  # Upstream error resolution. [web:6]

    # Send with receivers + customParams (param1..n). [web:2]
    sent = wati_client._send_template_message(  # Leverage the established v1 send path. [web:2]
        phone_number=payload.phone_number,
        template_name=template_name,
        params_list=payload.parameters,
        broadcast_name=payload.broadcast_name,
    )
    if not sent:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="WATI send failed")  # Non-200 or transport error. [web:2]
    return {"success": True, "template_name": template_name}  # Simple success response. [web:2]


@router.post("/send/booking")
def send_booking_template(payload: BookingSendRequest) -> Dict[str, Any]:
    """
    Send the booking confirmation template with ordered parameters matching the approved template. [web:2]
    """
    if not wati_client:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="WATI client not configured")  # Ensure initialized WATI client. [web:2]
    sent = wati_client.send_booking_confirmation(
        phone_number=payload.phone_number,
        customer_name=payload.customer_name,
        theme_name=payload.theme_name,
        start_time=payload.start_time,
        participants=payload.participants,
    )  # Uses receivers + customParams under the hood. [web:2]
    if not sent:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="WATI booking template send failed")  # Return upstream failure. [web:2]
    return {"success": True}  # Acknowledge success. [web:2]


@router.post("/send/reminder")
def send_reminder_template(payload: ReminderSendRequest) -> Dict[str, Any]:
    """
    Send a reusable reminder template by varying the timing_phrase (e.g., 'tomorrow' or 'in 1 hour'). [web:4]
    """
    if not wati_client:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="WATI client not configured")  # Guard for env/init issues. [web:2]
    # This calls the generic reminder template with ordered params per template definition. [web:2]
    sent = wati_client.send_custom_reminder(
        phone_number=payload.phone_number,
        timing_phrase=payload.timing_phrase,
        customer_name=payload.customer_name,
        theme_name=payload.theme_name,
        start_time=payload.start_time,
        participants=payload.participants,
    )  # Keep variables aligned with template param order. [web:7]
    if not sent:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="WATI reminder template send failed")  # Report failures declaratively. [web:2]
    return {"success": True}  # Minimal OK response. [web:2]
