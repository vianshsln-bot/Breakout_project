from fastapi import APIRouter,  HTTPException

import os
from supabase import create_client, Client as SupabaseClient
from dotenv import load_dotenv

router = APIRouter(prefix="/compute", tags=["Compute Functions"])


def safe_divide(num, denom):
    """Avoid divide by zero."""
    return round((num / denom) * 100, 2) if denom else 0


@router.get("/kpis")
def compute_kpis():
    """
    Compute all KPI metrics:
    1. First Call Resolution
    2. Avg Call Duration
    3. Positive Sentiment Rate
    4. Call Abandon Rate
    5. Missed Calls
    6. Customer Conversion Rate
    7. Overall Quality Score
    8. Customer Satisfaction
    """
    try:
        # Fetch data from Supabase
        calls_resp = supabase.table("Call").select("*").execute()
        analysis_resp = supabase.table("Call_analysis").select("*").execute()
        bookings_resp = supabase.table("Booking").select("*").execute()

        calls = calls_resp.data or []
        analysis = analysis_resp.data or []
        bookings = bookings_resp.data or []

        total_calls = len(calls)
        total_analysis = len(analysis)
        total_bookings = len(bookings)

        # ------------------------------
        # 1️⃣ First Call Resolution Rate
        # ------------------------------
        # A call is considered "resolved" if:
        #   transfered_to_human = False
        #   AND failed_conversation_reason is NULL
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
        # Let's define "abandoned" as failed_conversation_reason == "Abandoned"
        abandoned_calls = [a for a in analysis if (a.get("failed_conversation_reason") or "").lower() == "abandoned"]
        call_abandon_rate = safe_divide(len(abandoned_calls), total_analysis)

        # ------------------------------
        # 5️⃣ Missed Calls
        # ------------------------------
        # Missed calls are those with duration = 0 or transcript NULL
        missed_calls = [c for c in calls if (c.get("duration", 0) == 0 or not c.get("transcript"))]
        missed_call_count = len(missed_calls)

        # ------------------------------
        # 6️⃣ Customer Conversion Rate
        # ------------------------------
        booked = [b for b in bookings if (b.get("booking_status") or "").lower() == "booked"]
        customer_conversion_rate = safe_divide(len(booked), total_bookings)

        # ------------------------------
        # 7️⃣ Overall Quality Score
        # ------------------------------
        # Example weighted metric:
        # 50% FCR + 30% Positive Sentiment + 20% Low Abandon
        overall_quality_score = round(
            (first_call_resolution * 0.5) + (positive_sentiment_rate * 0.3) + ((100 - call_abandon_rate) * 0.2), 2
        )

        # ------------------------------
        # 8️⃣ Customer Satisfaction (Avg Rating)
        # ------------------------------
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
        }

        return {"status": "success", "kpis": kpi_data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
