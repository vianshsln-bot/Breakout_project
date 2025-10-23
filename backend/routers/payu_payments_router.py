from datetime import date, datetime, time
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from supabase_auth import Optional
from fastapi import Request, Response
import hashlib, os
from backend.config.bookeo import BookeoAPI


from backend.config.payu_client import (
    TransactionPage,
    get_payu_client,
    PayUManager,
    PaymentLinkRequest,
    PaymentLinkResponse,
    PayUAPIError,
)

def get_bookeo_client() -> BookeoAPI:
    # Optionally make this a cached singleton if desired
    return BookeoAPI()

router = APIRouter(prefix="/payments", tags=["payments"])


# @router.post(
#     "/create-link",
#     response_model=PaymentLinkResponse,       # ← return full response model
#     status_code=status.HTTP_201_CREATED,
#     summary="Create Payment Link"
# )
# async def create_payment_link(
#     request: PaymentLinkRequest,
#     payu: PayUManager = Depends(get_payu_client)
# ) -> PaymentLinkResponse:
#     try:
#         # This returns the full PayU API response, including status/message/result
#         return payu.create_payment_link(request)
#     except PayUAPIError as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=str(e)
#         )
    


@router.get(
    "/transaction-details",
    response_model=TransactionPage,
    status_code=status.HTTP_200_OK,
    summary="Check Transaction Details"
)
async def check_transaction_details(
    invoice_id: str,
    payu: PayUManager = Depends(get_payu_client),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
) -> TransactionPage:
    
    # Get the current date
    today = date.today()
    
    # Default to the start of the current day if not provided
    if date_from is None:
        date_from = datetime.combine(today, time.min)
        
    # Default to the end of the current day if not provided
    if date_to is None:
        date_to = datetime.combine(today, time.max)
    
    try:
        # Pass the resolved dates to your manager function
        return payu.get_transaction_details(invoice_id, date_from, date_to)
    except PayUAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )



PAYU_SALT = os.getenv("PAYU_SALT")
def payu_reverse_hash(p: dict, salt: str) -> str:
    # Reverse-hash per PayU:
    # SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    # If additionalCharges is present, prepend it: additionalCharges|SALT|status|... (same tail) 
    seq = [
        salt,
        p.get("status", ""),
        "", "", "", "", "",  # six empty pipes
        p.get("udf5", ""),
        p.get("udf4", ""),
        p.get("udf3", ""),
        p.get("udf2", ""),
        p.get("udf1", ""),
        p.get("email", ""),
        p.get("firstname", ""),
        p.get("productinfo", ""),
        p.get("amount", ""),
        p.get("txnid", ""),
        p.get("key", ""),
    ]
    base = "|".join(seq)
    if p.get("additionalCharges"):
        base = f"{p['additionalCharges']}|{base}"
    return hashlib.sha512(base.encode("utf-8")).hexdigest()


@router.post("/webhooks/payu")
async def payu_webhook(request: Request) -> Response:
    form = await request.form()
    print("\n\n")
    logging.info(f"Received PayU Webhook payload: {form}")
    payload = {k: (v.strip() if isinstance(v, str) else v) for k, v in form.items()}
    received = payload.get("hash", "")
    get_bookeo_client().create_booking_payment_from_payu(payload)
    
    if not PAYU_SALT or not received:
        return Response(content="invalid configuration or payload", status_code=status.HTTP_400_BAD_REQUEST)
    computed = payu_reverse_hash(payload, PAYU_SALT)
    if computed != received:
        return Response(content="invalid signature", status_code=status.HTTP_400_BAD_REQUEST)
    return Response(content="ok", status_code=status.HTTP_200_OK)
