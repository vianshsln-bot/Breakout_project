from enum import Enum
from fastapi import APIRouter, HTTPException, Query

from backend.services.dashboard_service import (
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
    get_overview,
    get_call_intent_summary,
    get_customer_rating_summary
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

class DateRange(str, Enum):
    today = "today"
    last_week = "last_week"
    last_month = "last_month"
    all_time = "all_time"

def tr_param(param: DateRange = Query(default=DateRange.all_time)) -> str:
    return param.value

@router.get("/calls-trend")
def calls_trend(time_range: DateRange = Query(default=DateRange.all_time)):
    try:
        return get_calls_trend(tr_param(time_range))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bookings-trend")
def bookings_trend(time_range: DateRange = Query(default=DateRange.all_time)):
    try:
        return get_bookings_trend(tr_param(time_range))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#@router.get("/lead-funnel")
#def lead_funnel(time_range: DateRange = Query(default=DateRange.all_time)):
#    try:
#        return get_lead_funnel(tr_param(time_range))
#    except Exception as e:
#        raise HTTPException(status_code=500, detail=str(e))

#@router.get("/lead-sources")
#def lead_sources(time_range: DateRange = Query(default=DateRange.all_time)):
#    try:
#        return get_lead_sources(tr_param(time_range))
#    except Exception as e:
#        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customer-growth")
def customer_growth(time_range: DateRange = Query(default=DateRange.all_time)):
    try:
        return get_customer_growth(tr_param(time_range))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @router.get("/customer-segments")
# def customer_segments(time_range: DateRange = Query(default=DateRange.all_time)):
#     try:
#         return get_customer_segments(tr_param(time_range))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#@router.get("/revenue-summary")
#def revenue_summary(time_range: DateRange = Query(default=DateRange.all_time)):
#    try:
#        return get_revenue_summary(tr_param(time_range))
#    except Exception as e:
#        raise HTTPException(status_code=500, detail=str(e))

@router.get("/payments-status")
def payments_status(time_range: DateRange = Query(default=DateRange.all_time)):
    try:
        return get_payments_status(tr_param(time_range))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sentiment-summary")
def sentiment_summary(time_range: DateRange = Query(default=DateRange.all_time)):
    try:
        return get_sentiment_summary(tr_param(time_range))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#@router.get("/satisfaction")
#def satisfaction(time_range: DateRange = Query(default=DateRange.all_time)):
#    try:
#        return get_satisfaction(tr_param(time_range))
#    except Exception as e:
#        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customer-rating-summary")
def customer_rating_summary(time_range: DateRange = Query(default=DateRange.all_time)):
    try:
        return get_customer_rating_summary(tr_param(time_range))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/call-intent-summary")
def call_intent_summary(time_range: DateRange = Query(default=DateRange.all_time)):
    try:
        return get_call_intent_summary(tr_param(time_range))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/overview")
def overview(time_range: DateRange = Query(default=DateRange.all_time)):
    try:
        return get_overview(tr_param(time_range))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
