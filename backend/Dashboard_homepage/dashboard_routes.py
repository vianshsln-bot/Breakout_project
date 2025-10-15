from fastapi import APIRouter, HTTPException
from dashboard_service import (
    get_calls_trend,
    get_bookings_trend,
    get_lead_funnel,
    get_lead_sources,
    get_customer_growth,
    get_customer_segments,
    get_revenue_summary,
    get_payments_status,
    get_sentiment_summary,
    get_satisfaction,
    get_overview
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/calls-trend")
def calls_trend():
    try:
        return get_calls_trend()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bookings-trend")
def bookings_trend():
    try:
        return get_bookings_trend()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lead-funnel")
def lead_funnel():
    try:
        return get_lead_funnel()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lead-sources")
def lead_sources():
    try:
        return get_lead_sources()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customer-growth")
def customer_growth():
    try:
        return get_customer_growth()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customer-segments")
def customer_segments():
    try:
        return get_customer_segments()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/revenue-summary")
def revenue_summary():
    try:
        return get_revenue_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payments-status")
def payments_status():
    try:
        return get_payments_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sentiment-summary")
def sentiment_summary():
    try:
        return get_sentiment_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/satisfaction")
def satisfaction():
    try:
        return get_satisfaction()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/overview")
def overview():
    try:
        return get_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
