from datetime import datetime, timedelta, timezone
from collections import defaultdict
from enum import Enum
from typing import Optional, Tuple
from zoneinfo import ZoneInfo

from backend.config.supabase_client import supabase

# ------------------------------------------------------------
# 1️⃣ ENUM FILTER FOR DROPDOWN IN SWAGGER
# ------------------------------------------------------------
class TimePeriod(str, Enum):
    today = "today"
    last_week = "last_week"
    last_month = "last_month"
    all_time = "all_time"

# ------------------------------------------------------------
# 2️⃣ TIME RANGE COMPUTATION (NO TIMEZONE)
# ------------------------------------------------------------
def get_time_bounds(time_range: Optional[TimePeriod] = TimePeriod.all_time) -> Tuple[Optional[str], Optional[str]]:
    """Return ISO start and end timestamps (UTC-free)."""
    today = datetime.utcnow().date()

    if time_range == TimePeriod.all_time:
        return None, None
    elif time_range == TimePeriod.today:
        start = datetime.combine(today, datetime.min.time())
        end = datetime.utcnow()
    elif time_range == TimePeriod.last_week:
        start = datetime.combine(today - timedelta(days=6), datetime.min.time())
        end = datetime.utcnow()
    elif time_range == TimePeriod.last_month:
        start = datetime.combine(today - timedelta(days=29), datetime.min.time())
        end = datetime.utcnow()
    else:
        return None, None

    # Return simple ISO strings (no timezone info)
    return start.isoformat(), end.isoformat()

# ------------------------------------------------------------
# 3️⃣ GENERIC RPC WRAPPER
# ------------------------------------------------------------
def call_rpc(fn_name: str, start_iso: Optional[str], end_iso: Optional[str]):
    resp = supabase.rpc(fn_name, {"p_start_time": start_iso, "p_end_time": end_iso}).execute()
    return resp.data or []

# ------------------------------------------------------------
# 4️⃣ DASHBOARD KPI FUNCTIONS
# ------------------------------------------------------------
def get_calls_trend(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_calls_trend", s, e)
    return {"dates": [r["date"] for r in data], "calls": [r["calls"] for r in data]}

def get_bookings_trend(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_bookings_trend", s, e)
    return {"dates": [r["date"] for r in data], "bookings": [r["confirmed_bookings"] for r in data]}

def get_lead_funnel(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_lead_funnel", s, e)
    return {"stages": [r["status"] for r in data], "counts": [r["count"] for r in data]}

def get_lead_sources(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_lead_sources", s, e)
    return {"sources": [r["source"] for r in data], "conversions": [r["conversions"] for r in data]}

def get_customer_growth(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_customer_growth", s, e)
    return {"dates": [r["date"] for r in data], "new_customers": [r["new_customers"] for r in data]}

def get_customer_segments(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_customer_segments", s, e)
    return {"segments": [r["city"] for r in data], "counts": [r["count"] for r in data]}

def get_revenue_summary(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_revenue_summary", s, e)
    if not data:
        return {"total_revenue": 0, "total_received": 0, "total_dues": 0}
    row = data[0]
    return {
        "total_revenue": float(row.get("total_revenue") or 0),
        "total_received": float(row.get("total_received") or 0),
        "total_dues": float(row.get("total_dues") or 0),
    }

def get_payments_status(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_payments_status", s, e)
    return {"labels": [r["payment_status"] for r in data], "values": [float(r["total"] or 0) for r in data]}

def get_sentiment_summary(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_sentiment_summary", s, e)
    if not data:
        return {"positive": 0, "neutral": 0, "negative": 0}
    row = data[0]
    return {k: int(row.get(k) or 0) for k in ["positive", "neutral", "negative"]}

def get_call_intent_summary(time_range: TimePeriod = TimePeriod.all_time):
    s, e = get_time_bounds(time_range)
    data = call_rpc("get_call_intent_summary", s, e)
    return {"intents": [r["call_intent"] for r in data], "counts": [r["count"] for r in data]}

# ------------------------------------------------------------
# 5️⃣ COMBINED OVERVIEW FUNCTION
# ------------------------------------------------------------
def get_overview(time_range: TimePeriod = TimePeriod.all_time):
    return {
        "calls_trend": get_calls_trend(time_range),
        "bookings_trend": get_bookings_trend(time_range),
        "lead_funnel": get_lead_funnel(time_range),
        "lead_sources": get_lead_sources(time_range),
        "customer_growth": get_customer_growth(time_range),
        "revenue_summary": get_revenue_summary(time_range),
        "payments_status": get_payments_status(time_range),
        "sentiment_summary": get_sentiment_summary(time_range),
        "call_intent": get_call_intent_summary(time_range),
    }
