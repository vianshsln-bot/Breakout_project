from fastapi import APIRouter, HTTPException, Depends, status
from backend.config.payu_client import (
    get_payu_client,
    PayUManager,
    PaymentLinkRequest,
    PaymentLinkResponse,
    PayUAPIError,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post(
    "/create-link",
    response_model=PaymentLinkResponse,       # ← return full response model
    status_code=status.HTTP_201_CREATED,
    summary="Create Payment Link"
)
async def create_payment_link(
    request: PaymentLinkRequest,
    payu: PayUManager = Depends(get_payu_client)
) -> PaymentLinkResponse:
    try:
        # This returns the full PayU API response, including status/message/result
        return payu.create_payment_link(request)
    except PayUAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    

