# routers/kpi_router.py
import enum
from fastapi import FastAPI, APIRouter, HTTPException, Query, status, Depends
from typing import List, Dict, Any, Optional, Tuple
from datetime import timedelta, datetime, timezone, date
from backend.config.supabase_client import supabase
from collections import defaultdict

router = APIRouter(prefix="/kpis", tags=["KPIs"])


# ------------------------------------------------------------
# ✅ GLOBAL TIME FILTER HANDLING
# ------------------------------------------------------------
class TimePeriod(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    half_yearly = "half_yearly"
    yearly = "yearly"


# Global state to persist currently applied filter
GLOBAL_TIME_FILTER = {
    "period": TimePeriod.monthly,
    "start_date": None,
    "end_date": None
}


def compute_date_range(
    filter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Tuple[datetime, datetime]:
    """
    Compute start_date and end_date either from:
    - custom range (takes priority)
    - predefined time period
    Defaults to monthly if nothing provided.
    """
    today = datetime.utcnow().date()

    # Custom date range has top priority
    if start_date and end_date:
        s = datetime.strptime(start_date, "%Y-%m-%d").date()
        e = datetime.strptime(end_date, "%Y-%m-%d").date()
        GLOBAL_TIME_FILTER.update({"period": None, "start_date": s, "end_date": e})
        return s, e

    selected_filter = filter or GLOBAL_TIME_FILTER.get("period", TimePeriod.monthly)

    if selected_filter == TimePeriod.daily:
        start, end = today, today
    elif selected_filter == TimePeriod.weekly:
        start, end = today - timedelta(days=7), today
    elif selected_filter == TimePeriod.monthly:
        start, end = today.replace(day=1), today
    elif selected_filter == TimePeriod.quarterly:
        start, end = today - timedelta(days=90), today
    elif selected_filter == TimePeriod.half_yearly:
        start, end = today - timedelta(days=180), today
    elif selected_filter == TimePeriod.yearly:
        start, end = today.replace(month=1, day=1), today
    else:
        start, end = today.replace(day=1), today

    GLOBAL_TIME_FILTER.update({"period": selected_filter, "start_date": start, "end_date": end})
    return start, end


def get_global_time_filter(
    filter: Optional[TimePeriod] = Query(None, description="Time period filter"),
    start_date: Optional[str] = Query(None, description="Custom range start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Custom range end date (YYYY-MM-DD)")
) -> Tuple[datetime, datetime]:
    """Dependency to inject the global date range into all endpoints."""
    return compute_date_range(filter, start_date, end_date)


# ------------------------------------------------------------
# ✅ BOOKING KPIS
# ------------------------------------------------------------
@router.get("/bookings", response_model=List[Dict[str, Any]])
async def get_booking_kpis(
    date_range: Tuple[datetime, datetime] = Depends(get_global_time_filter),
    interval: str = Query("full", description="full, daily, weekly, monthly, quarterly, half_yearly, yearly")
):
    """Booking KPIs"""
    start_time, end_time = date_range

    try:
        resp = supabase.rpc(
            'get_booking_metrics',
            {
                'p_start_time': start_time,
                'p_end_time': end_time,
                'p_interval': interval
            }
        ).execute()

        if not resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No KPI data found.")
        row = resp.data[0]

        return [
            {"name": "total_bookings", "value": row['total_bookings']},
            {"name": "booking_conversion_rate", "value": round(row['booking_conversion_rate'], 2), "unit": "%"},
            {"name": "avg_booking_value", "value": round(row['avg_booking_value'], 2), "unit": "currency"},
            {"name": "cancellation_rate", "value": round(row['cancellation_rate'], 2), "unit": "%"},
            {"name": "repeat_booking_rate", "value": round(row['repeat_booking_rate'], 2), "unit": "%"},
            {"name": "total_gross_revenue", "value": float(row['total_gross_revenue']), "unit": "currency"},
            {"name": "total_collections", "value": float(row['total_collections']), "unit": "currency"},
        ]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ------------------------------------------------------------
# ✅ CUSTOMER KPIS
# ------------------------------------------------------------
@router.get("/customers", response_model=List[Dict[str, Any]])
async def get_customer_kpis(date_range: Tuple[datetime, datetime] = Depends(get_global_time_filter)):
    """Customer KPIs"""
    start_time, end_time = date_range

    try:
        params = {
            "start_time": start_time,
            "end_time": end_time,
        }
        response = supabase.rpc('get_all_customer_kpis', params).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="No KPI data found.")

        kpis = response.data[0]

        return [
            {"name": "total_customers", "value": kpis['total_customers']},
            {"name": "new_customers", "value": kpis['new_customers']},
            {"name": "avg_spend_per_customer", "value": round(kpis['avg_spend_per_customer'], 2), "unit": "currency"},
            {"name": "customer_conversion_rate", "value": round(kpis['customer_conversion_rate'], 2), "unit": "%"}
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ------------------------------------------------------------
# ✅ LEAD KPIS
# ------------------------------------------------------------
@router.get("/leads", response_model=List[Dict[str, Any]])
async def get_lead_kpis(date_range: Tuple[datetime, datetime] = Depends(get_global_time_filter)):
    """Lead KPIs"""
    try:
        response = supabase.rpc('get_all_lead_kpis').execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="No KPI data found.")
            
        kpis = response.data[0]

        return [
            {"name": "total_leads_generated", "value": kpis['total_leads_generated']},
            {"name": "lead_conversion_rate", "value": round(kpis['lead_conversion_rate'], 2), "unit": "%"},
            {"name": "avg_lead_response_time", "value": round(kpis['avg_lead_response_time'], 2), "unit": "hours"},
            {"name": "best_lead_source", "value": kpis['best_lead_source']},
            {"name": "qualified_lead_ratio", "value": round(kpis['qualified_lead_ratio'], 2), "unit": "%"},
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ------------------------------------------------------------
# ✅ PAYMENT KPIS
# ------------------------------------------------------------
@router.get("/payments", response_model=List[Dict[str, Any]])
async def get_payment_kpis(date_range: Tuple[datetime, datetime] = Depends(get_global_time_filter)):
    """Payment KPIs"""
    start_time, end_time = date_range
    try:
        params = {'start_time': start_time, 'end_time': end_time}
        response = supabase.rpc('get_all_payment_kpis', params).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="No KPI data found.")

        kpis = response.data[0]

        return [
            {"name": "total_revenue_collected", "value": round(kpis['total_revenue_collected'], 2), "unit": "currency"},
            {"name": "outstanding_payments", "value": round(kpis['outstanding_payments'], 2), "unit": "currency"},
            {"name": "avg_payment_value", "value": round(kpis['avg_payment_value'], 2), "unit": "currency"},
            {"name": "revenue_growth_rate", "value": round(kpis['revenue_growth_rate'], 2), "unit": "%"},
            {"name": "refund_chargeback_rate", "value": round(kpis['refund_chargeback_rate'], 2), "unit": "%"},
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))



# ------------------------------------------------------------
# ✅ AI-RELATED KPI ENDPOINT (FILTER-AWARE)
# ------------------------------------------------------------
@router.get("/llmkpi")
def get_analysis_llmkpis(
    date_range: Tuple[datetime, datetime] = Depends(get_global_time_filter)
):
    """
    Returns AI-related call analysis KPIs (filtered by global time range).
    """
    start_time, end_time = date_range

    try:
        # Fetch data within date range
        call_resp = (
            supabase.table("call")
            .select("conv_id, date_time")
            .gte("date_time", start_time.isoformat())
            .lte("date_time", end_time.isoformat())
            .execute()
        )
        conv_ids = [r["conv_id"] for r in call_resp.data or []]

        if not conv_ids:
            return {"llmkpi": [], "message": "No calls found in selected time range."}

        response = (
            supabase.table("call_analysis")
            .select("*")
            .in_("conv_id", conv_ids)
            .execute()
        )
        records = response.data or []

        if not records:
            return {"llmkpi": [], "message": "No AI analysis data found in selected period."}

        total_calls = len(records)
        ai_calls = sum(1 for r in records if r.get("ai_detect_flag"))
        human_calls = sum(1 for r in records if r.get("human_agent_flag"))
        out_of_scope_calls = sum(1 for r in records if r.get("out_of_scope"))
        ai_success_calls = sum(
            1 for r in records if r.get("ai_detect_flag") and not r.get("failed_conversion_reason")
        )

        llmkpi = [
            {
                "name": "AI Detection Rate",
                "value": round((ai_calls / total_calls) * 100, 2) if total_calls else 0,
                "description": "% of calls detected or handled by AI",
                "output_format": "percentage (0–100%)"
            },
            {
                "name": "Human Agent Involvement Rate",
                "value": round((human_calls / total_calls) * 100, 2) if total_calls else 0,
                "description": "% of calls where human agent was required",
                "output_format": "percentage (0–100%)"
            },
            {
                "name": "Out-of-Scope Rate",
                "value": round((out_of_scope_calls / total_calls) * 100, 2) if total_calls else 0,
                "description": "Share of calls where query was irrelevant or unanswerable",
                "output_format": "percentage (0–100%)"
            },
            {
                "name": "AI Success Rate",
                "value": round((ai_success_calls / ai_calls) * 100, 2) if ai_calls else 0,
                "description": "Effectiveness of AI in resolving calls",
                "output_format": "percentage (0–100%)"
            }
        ]

        return {"llmkpi": llmkpi}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KPIs: {e}")


# ------------------------------------------------------------
# ✅ CHART DATA ENDPOINT (FILTER-AWARE)
# ------------------------------------------------------------
@router.get("/charts")
def get_analysis_charts(
    date_range: Tuple[datetime, datetime] = Depends(get_global_time_filter)
):
    """
    Returns key chart datasets for visual analytics by joining call and call_analysis on conv_id.
    """
    start_time, end_time = date_range

    try:
        # ✅ Step 1: Fetch filtered call data
        call_response = (
            supabase.table("call")
            .select("conv_id, date_time")
            .gte("date_time", start_time.isoformat())
            .lte("date_time", end_time.isoformat())
            .execute()
        )
        call_data = call_response.data or []
        conv_ids = [r["conv_id"] for r in call_data]

        # ✅ Step 2: Fetch only analysis records for those conv_ids
        analysis_response = (
            supabase.table("call_analysis")
            .select("*")
            .in_("conv_id", conv_ids)
            .execute()
        )
        analysis_data = analysis_response.data or []

        if not call_data or not analysis_data:
            return {"charts": [], "message": "No data available in one or both tables for this range."}

        # ✅ Step 3: Merge both datasets
        call_date_map = {row["conv_id"]: row.get("date_time") for row in call_data if row.get("date_time")}
        analysis_records = [
            {**row, "date_time": call_date_map[row["conv_id"]]}
            for row in analysis_data if row.get("conv_id") in call_date_map
        ]

        if not analysis_records:
            return {"charts": [], "message": "No matching conversation IDs between tables."}

        # ✅ Chart 1: Analysis Volume Over Time
        volume_by_date = defaultdict(int)
        for r in analysis_records:
            if r.get("date_time"):
                date_str = r["date_time"].split("T")[0]
                volume_by_date[date_str] += 1

        chart1 = {
            "title": "Analysis Volume Over Time",
            "x_axis": list(volume_by_date.keys()),
            "y_axis": list(volume_by_date.values()),
            "chart_type": "line"
        }

        # ✅ Chart 2: Average Sentiment by Failed Conversion Reason
        sentiment_by_reason = defaultdict(list)
        for r in analysis_records:
            reason = r.get("failed_conversion_reason")
            if reason:
                try:
                    sentiment_by_reason[reason].append(float(r.get("sentiment_score") or 0))
                except (TypeError, ValueError):
                    continue

        avg_sentiment = {
            reason: round(sum(vals) / len(vals), 3)
            for reason, vals in sentiment_by_reason.items() if vals
        }

        chart2 = {
            "title": "Average Sentiment by Failed Conversion Reason",
            "x_axis": list(avg_sentiment.keys()),
            "y_axis": list(avg_sentiment.values()),
            "chart_type": "bar"
        }


	# ✅ Chart 3: AI Detection Trend Over Time
        ai_by_week = defaultdict(lambda: {"ai": 0, "total": 0})
        for r in analysis_records:
            if r.get("date_time"):
                date_obj = datetime.fromisoformat(r["date_time"].split("T")[0])
                week_start = date_obj.strftime("%Y-%W")
                ai_by_week[week_start]["total"] += 1
                if r.get("ai_detect_flag"):
                    ai_by_week[week_start]["ai"] += 1
            			


        ai_trend = {
            week: round((vals["ai"] / vals["total"]) * 100, 2)
            for week, vals in ai_by_week.items() if vals["total"] > 0
        }

        chart3 = {
            "title": "AI Detection Trend Over Time",
            "x_axis": list(ai_trend.keys()),
            "y_axis": list(ai_trend.values()),
            "chart_type": "line"
        }

        # ✅ Final Response
        return {"charts": [chart1, chart2, chart3]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chart data: {str(e)}")
