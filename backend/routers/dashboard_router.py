from enum import Enum
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from enum import Enum
from fastapi import APIRouter, HTTPException, Query, Depends
from backend.config.supabase_client import supabase
from backend.services.dashboard_service import (
    TimePeriod,
    get_overview,
    get_time_bounds
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

class DateRange(str, Enum):
    today = "today"
    last_week = "last_week"
    last_month = "last_month"
    all_time = "all_time"

def tr_param(param: DateRange = Query(default=DateRange.all_time)) -> str:
    return param.value

# @router.get("/calls-trend")
# def calls_trend(time_range: DateRange = Query(default=DateRange.all_time)):
#     try:
#         return get_calls_trend(tr_param(time_range))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/bookings-trend")
# def bookings_trend(time_range: DateRange = Query(default=DateRange.all_time)):
#     try:
#         return get_bookings_trend(tr_param(time_range))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

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

# @router.get("/customer-growth")
# def customer_growth(time_range: DateRange = Query(default=DateRange.all_time)):
#     try:
#         return get_customer_growth(tr_param(time_range))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

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

##@router.get("/payments-status")
#def payments_status(time_range: DateRange = Query(default=DateRange.all_time)):
#    try:
#        return get_payments_status(tr_param(time_range))
#    except Exception as e:
#        raise HTTPException(status_code=500, detail=str(e))

# @router.get("/sentiment-summary")
# def sentiment_summary(time_range: DateRange = Query(default=DateRange.all_time)):
#     try:
#         return get_sentiment_summary(tr_param(time_range))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

#@router.get("/satisfaction")
#def satisfaction(time_range: DateRange = Query(default=DateRange.all_time)):
#    try:
#        return get_satisfaction(tr_param(time_range))
#    except Exception as e:
#        raise HTTPException(status_code=500, detail=str(e))


# @router.get("/customer-rating-summary")
# def customer_rating_summary(time_range: DateRange = Query(default=DateRange.all_time)):
#     try:
#         return get_customer_rating_summary(tr_param(time_range))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/call-intent-summary")
# def call_intent_summary(time_range: DateRange = Query(default=DateRange.all_time)):
#     try:
#         return get_call_intent_summary(tr_param(time_range))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------
# 6️⃣ ROUTER ENDPOINT WITH DROPDOWN FILTER
# ------------------------------------------------------------
@router.get("/overview", response_model=Dict[str, Any])
async def get_dashboard_overview(
    filter: TimePeriod = Query(default=TimePeriod.all_time, description="Select time filter: today, last_week, last_month, all_time")
):
    """Dashboard Overview with dropdown filter support."""
    start_time, end_time = get_time_bounds(filter)

    try:
        overview_data = get_overview(filter)

        return {
            "filters": {"filter": filter, "start_time": start_time, "end_time": end_time},
            "overview": overview_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard overview: {str(e)}")

