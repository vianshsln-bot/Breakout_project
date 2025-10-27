from fastapi import FastAPI, APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from postgrest import APIError
from backend.config.supabase_client import supabase

router = APIRouter(prefix="/compute", tags=["Compute Functions"])

def safe_divide(num, denom):
    """Avoid divide by zero."""
    return round((num / denom) * 100, 2) if denom else 0


def get_date_range(filter: Optional[str], start_date: Optional[str], end_date: Optional[str]):
    """Returns start and end dates based on filter."""
    today = datetime.utcnow().date()

    if filter == "today":
        return today, today
    elif filter == "last_week":
        return today - timedelta(days=7), today
    elif filter == "last_month":
        return today - timedelta(days=30), today
    elif start_date and end_date:
        try:
            return datetime.fromisoformat(start_date).date(), datetime.fromisoformat(end_date).date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        return None, None


@router.get("/kpis")
def compute_kpis(
    filter: Optional[str] = Query(None, description="Filter by: today, last_week, last_month"),
    start_date: Optional[str] = Query(None, description="Custom start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Custom end date (YYYY-MM-DD)")
):
    """
    Compute KPIs with dual filtering logic:
    - Date filters applied via 'filter' or 'start_date'/'end_date'.
    - Uses call.date_time for time range filtering.
    - call_analysis joined via conv_id to call.
    """

    try:
        # Step 1️⃣ Determine date range
        start, end = get_date_range(filter, start_date, end_date)

        # Step 2️⃣ Base queries
        calls_query = supabase.table("call").select("*")
        bookings_query = supabase.table("bookings").select("*")

        # Step 3️⃣ Apply date filters to call and bookings
        if start and end:
            calls_query = calls_query.gte("date_time", str(start)).lte("date_time", str(end))
            bookings_query = bookings_query.gte("creation_time", str(start)).lte("creation_time", str(end))

        # Step 4️⃣ Execute queries
        calls_resp = calls_query.execute()
        bookings_resp = bookings_query.execute()

        calls = calls_resp.data or []
        bookings = bookings_resp.data or []

        # Step 5️⃣ Get related conv_ids for analysis
        conv_ids = [c["conv_id"] for c in calls if "conv_id" in c]
        analysis = []

        if conv_ids:
            # Supabase only allows filtering up to 1000 IDs at once; chunk if large
            chunk_size = 500
            for i in range(0, len(conv_ids), chunk_size):
                chunk = conv_ids[i:i + chunk_size]
                resp = supabase.table("call_analysis").select("*").in_("conv_id", chunk).execute()
                if resp.data:
                    analysis.extend(resp.data)

        total_calls = len(calls)
        total_analysis = len(analysis)
        total_bookings = len(bookings)

        # -------------------------------------
        # KPI COMPUTATION
        # -------------------------------------

        # 1️⃣ First Call Resolution
        resolved_calls = [
            a for a in analysis if not a.get("transfered_to_human") and not a.get("failed_conversation_reason")
        ]
        first_call_resolution = safe_divide(len(resolved_calls), total_analysis)

        # 2️⃣ Avg Call Duration
        avg_call_duration = 0
        if total_calls > 0:
            durations = [c.get("duration", 0) or 0 for c in calls]
            avg_call_duration = round(sum(durations) / total_calls, 2)

        # 3️⃣ Positive Sentiment Rate
        positive_calls = [a for a in analysis if (a.get("sentiment") or "").lower() == "positive"]
        positive_sentiment_rate = safe_divide(len(positive_calls), total_analysis)

        # 4️⃣ Call Abandon Rate
        abandoned_calls = [a for a in analysis if (a.get("failed_conversation_reason") or "").lower() == "abandoned"]
        call_abandon_rate = safe_divide(len(abandoned_calls), total_analysis)

        # 5️⃣ Missed Calls
        missed_calls = [c for c in calls if (c.get("duration", 0) == 0 or not c.get("transcript"))]
        missed_call_count = len(missed_calls)

        # 6️⃣ Customer Conversion Rate
        booked = [b for b in bookings if (b.get("status") or "").lower() == "booked"]
        customer_conversion_rate = safe_divide(len(booked), total_bookings)

        # 7️⃣ Overall Quality Score
        overall_quality_score = round(
            (first_call_resolution * 0.5)
            + (positive_sentiment_rate * 0.3)
            + ((100 - call_abandon_rate) * 0.2),
            2,
        )

        # 8️⃣ Customer Satisfaction (Avg Rating)
        ratings = [a.get("customer_rating", 0) or 0 for a in analysis if a.get("customer_rating") is not None]
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0

        # Final KPI JSON
        kpi_data = {
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
            "date_filter_applied": {
                "filter": filter,
                "start_date": str(start),
                "end_date": str(end)
            },
        }

        return {"status": "success", "kpis": kpi_data}

    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing KPIs: {str(e)}")
