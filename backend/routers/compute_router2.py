from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional
from backend.config.supabase_client import supabase
from collections import defaultdict

router = APIRouter(prefix="/compute", tags=["Compute Functions"])

# ------------------------------------------------------------
# 🕒 DATE RANGE HELPER
# ------------------------------------------------------------
def get_date_range(
    filter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    today = datetime.utcnow().date()

    # ✅ 1. Custom date range overrides everything
    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date).date()
            end = datetime.fromisoformat(end_date).date()
            return start, end, "custom_range"
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format (use YYYY-MM-DD)")

    # ✅ 2. Predefined time filters
    if filter == "today":
        start, end = today, today
    elif filter == "weekly":
        start, end = today - timedelta(days=7), today
    elif filter == "monthly" or filter is None:
        start, end = today - timedelta(days=30), today
    elif filter == "quarterly":
        start, end = today - timedelta(days=90), today
    elif filter == "yearly":
        start, end = today - timedelta(days=365), today
    else:
        raise HTTPException(status_code=400, detail="Invalid filter. Use today, weekly, monthly, quarterly, or yearly.")

    return start, end, filter


# ------------------------------------------------------------
# 🧮 SAFE DIVISION HELPER
# ------------------------------------------------------------
def safe_divide(num, denom):
    """Avoid divide by zero."""
    return round((num / denom) * 100, 2) if denom else 0


# ------------------------------------------------------------
# 📊 MAIN KPI COMPUTE ENDPOINT
# ------------------------------------------------------------
@router.get("/kpis")
def compute_kpis(
    filter: Optional[str] = Query(None, description="Filter period: today, weekly, monthly, quarterly, yearly"),
    start_date: Optional[str] = Query(None, description="Custom start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Custom end date (YYYY-MM-DD)")
):
    """
    Compute KPIs with unified date filtering:
    - TimePeriod filter (today, weekly, etc.)
    - OR custom start/end date range.
    """
    try:
        # ✅ Determine date range
        start, end, applied_filter = get_date_range(filter, start_date, end_date)

        # ✅ Fetch filtered data from Supabase
        calls_resp = (
            supabase.table("call")
            .select("*")
            .gte("date_time", start.isoformat())
            .lte("date_time", end.isoformat())
            .execute()
        )
        analysis_resp = (
            supabase.table("call_analysis")
            .select("*")
            .gte("date_time", start.isoformat())
            .lte("date_time", end.isoformat())
            .execute()
        )
        bookings_resp = (
            supabase.table("bookings")
            .select("*")
            .gte("created_at", start.isoformat())
            .lte("created_at", end.isoformat())
            .execute()
        )

        calls = calls_resp.data or []
        analysis = analysis_resp.data or []
        bookings = bookings_resp.data or []

        total_calls = len(calls)
        total_analysis = len(analysis)
        total_bookings = len(bookings)

        # ------------------------------
        # 1️⃣ First Call Resolution Rate
        # ------------------------------
        resolved_calls = [
            a for a in analysis if not a.get("transfered_to_human") and not a.get("failed_conversation_reason")
        ]
        first_call_resolution = safe_divide(len(resolved_calls), total_analysis)

        # ------------------------------
        # 2️⃣ Average Call Duration
        # ------------------------------
        avg_call_duration = 0
        if total_calls > 0:
            durations = [c.get("duration", 0) or 0 for c in calls]
            avg_call_duration = round(sum(durations) / total_calls, 2)

        # ------------------------------
        # 3️⃣ Positive Sentiment Rate
        # ------------------------------
        positive_calls = [a for a in analysis if (a.get("sentiment") or "").lower() == "positive"]
        positive_sentiment_rate = safe_divide(len(positive_calls), total_analysis)

        # ------------------------------
        # 4️⃣ Call Abandon Rate
        # ------------------------------
        abandoned_calls = [a for a in analysis if (a.get("failed_conversation_reason") or "").lower() == "abandoned"]
        call_abandon_rate = safe_divide(len(abandoned_calls), total_analysis)

        # ------------------------------
        # 5️⃣ Missed Calls
        # ------------------------------
        missed_calls = [c for c in calls if (c.get("duration", 0) == 0 or not c.get("transcript"))]
        missed_call_count = len(missed_calls)

        # ------------------------------
        # 6️⃣ Customer Conversion Rate
        # ------------------------------
        booked = [b for b in bookings if (b.get("status") or "").lower() == "booked"]
        customer_conversion_rate = safe_divide(len(booked), total_bookings)

        # ------------------------------
        # 7️⃣ Overall Quality Score
        # ------------------------------
        overall_quality_score = round(
            (first_call_resolution * 0.5) + (positive_sentiment_rate * 0.3) + ((100 - call_abandon_rate) * 0.2), 2
        )

        # ------------------------------
        # 8️⃣ Customer Satisfaction (Avg Rating)
        # ------------------------------
        ratings = [a.get("customer_rating", 0) or 0 for a in analysis if a.get("customer_rating") is not None]
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0

        # ✅ Final KPI JSON
        kpi_data = {
            "filter_applied": applied_filter,
            "date_range": {"start": str(start), "end": str(end)},
            "total_calls": total_calls,
            "analyzed_calls": total_analysis,
            "first_call_resolution_pct": first_call_resolution,
            "avg_call_duration_sec": avg_call_duration,
            "positive_sentiment_rate_pct": positive_sentiment_rate,
            "call_abandon_rate_pct": call_abandon_rate,
            "missed_calls": missed_call_count,
            "customer_conversion_rate_pct": customer_conversion_rate,
            "overall_quality_score": overall_quality_score,
            "customer_satisfaction_avg_rating": avg_rating,
        }

        return {"status": "success", "kpis": kpi_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing KPIs: {str(e)}")
