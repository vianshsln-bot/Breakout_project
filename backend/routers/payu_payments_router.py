from datetime import date, datetime, time
from fastapi import APIRouter, HTTPException, Depends, status
from supabase_auth import Optional
from backend.config.payu_client import (
    TransactionPage,
    get_payu_client,
    PayUManager,
    PaymentLinkRequest,
    PaymentLinkResponse,
    PayUAPIError,
)

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
