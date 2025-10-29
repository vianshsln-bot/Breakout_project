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
    today = "today"
    last_week = "last_week"
    last_month = "last_month"
    all_time = "all_time"



# Global state to persist currently applied filter
GLOBAL_TIME_FILTER = {
    "period": TimePeriod.all_time,
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
        return s, e #s.isoformat(), e.isoformat()

    selected_filter = filter or GLOBAL_TIME_FILTER.get("period", TimePeriod.all_time)

    if selected_filter == TimePeriod.today:
        start, end = today, today
    elif selected_filter == TimePeriod.last_week:
        start, end = today - timedelta(days=7), today
    elif selected_filter == TimePeriod.last_month:
        start, end = today.replace(day=1), today
    elif filter == TimePeriod.all_time:
        return None, None  # no filtering applied
    elif start and end:
        try:
            return datetime.fromisoformat(start_date).date(), datetime.fromisoformat(end_date).date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        return None, None

    GLOBAL_TIME_FILTER.update({"period": selected_filter, "start_date": start, "end_date": end})
    return start.isoformat(), end.isoformat()


def get_global_time_filter(
    filter: Optional[TimePeriod] = Query(None, description="Time period filter"),
    start_date: Optional[str] = Query(None, description="Custom range start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Custom range end date (YYYY-MM-DD)")
) -> Tuple[Optional[str], Optional[str]]:
    """Dependency to inject the global date range into all endpoints."""
    return compute_date_range(filter, start_date, end_date)


class Interval(str, enum.Enum):
    today = "today"
    last_week = "last_week"
    last_month = "last_month"
    all_time = "all_time"

def _build_params(interval: Interval, start_time: Optional[str], end_time: Optional[str]) -> Dict[str, Any]:
    params: Dict[str, Any] = {"p_interval": interval.value}
    if start_time:
        params["p_start_time"] = start_time
    if end_time:
        params["p_end_time"] = end_time
    return params

# -------------------------
# Bookings KPIs (RPC)
# -------------------------
@router.get("/bookings", response_model=List[Dict[str, Any]])
def get_booking_kpis(
    interval: Interval = Query(..., description="today | last_week | last_month | all_time"),
    start_time: Optional[str] = Query(None, description="Start timestamp (ISO 8601 UTC, optional)"),
    end_time: Optional[str] = Query(None, description="End timestamp (ISO 8601 UTC, optional)")
):
    try:
        params = _build_params(interval, start_time, end_time)
        resp = supabase.rpc("get_booking_metrics", params).execute()
        data = resp.data or []
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No KPI data found.")
        row = data[0] if isinstance(data, list) else data

        return [
            {"name": "total_bookings", "value": row.get("total_bookings", 0)},
            {"name": "booking_conversion_rate", "value": round(row.get("booking_conversion_rate", 0.0), 2), "unit": "%"},
            {"name": "avg_booking_value", "value": round(row.get("avg_booking_value", 0.0), 2), "unit": "currency"},
            {"name": "cancellation_rate", "value": round(row.get("cancellation_rate", 0.0), 2), "unit": "%"},
            {"name": "repeat_booking_rate", "value": round(row.get("repeat_booking_rate", 0.0), 2), "unit": "%"},
            {"name": "total_gross_revenue", "value": float(row.get("total_gross_revenue", 0.0)), "unit": "currency"},
            {"name": "total_collections", "value": float(row.get("total_collections", 0.0)), "unit": "currency"},
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# -------------------------
# Leads KPIs (RPC)
# -------------------------
@router.get("/leads", response_model=List[Dict[str, Any]])
async def get_lead_kpis(
    date_range: Tuple[datetime, datetime] = Depends(get_global_time_filter),
    interval: str = Query("full", description="Time period: today, last_week, last_month, or full")
):
    """Lead KPIs (date + interval aware)"""
    start_time, end_time = date_range

    try:
        # 🧠 Pass start_time, end_time, and interval to the SQL function
        response = supabase.rpc(
            'get_all_lead_kpis',
            {
                'p_start_time': start_time,
                'p_end_time': end_time,
                'p_interval': interval
            }
        ).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="No KPI data found for the selected range.")

        kpis = response.data[0]

        return [
            {"name": "total_leads_generated", "value": kpis['total_leads_generated']},
            {"name": "lead_conversion_rate", "value": round(kpis['lead_conversion_rate'], 2), "unit": "%"},
            {"name": "avg_lead_response_time", "value": round(kpis['avg_lead_response_time'], 2), "unit": "hours"},
            {"name": "best_lead_source", "value": kpis['best_lead_source']},
            {"name": "qualified_lead_ratio", "value": round(kpis['qualified_lead_ratio'], 2), "unit": "%"},
        ]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching lead KPIs: {str(e)}"
        )


# -------------------------
# Customers KPIs (RPC)
# -------------------------
@router.get("/customers", response_model=List[Dict[str, Any]])
def get_customer_kpis(
    interval: Interval = Query(..., description="today | last_week | last_month | all_time"),
    start_time: Optional[str] = Query(None, description="Start timestamp (ISO 8601 UTC, optional)"),
    end_time: Optional[str] = Query(None, description="End timestamp (ISO 8601 UTC, optional)")
):
    try:
        params = _build_params(interval, start_time, end_time)
        resp = supabase.rpc("get_all_customer_kpis", params).execute()
        data = resp.data or []
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No KPI data found.")
        kpis = data[0] if isinstance(data, list) else data

        return [
            {"name": "total_customers", "value": kpis.get("total_customers", 0)},
            {"name": "new_customers", "value": kpis.get("new_customers", 0)},
            {"name": "avg_spend_per_customer", "value": round(kpis.get("avg_spend_per_customer", 0.0), 2), "unit": "currency"},
            {"name": "customer_conversion_rate", "value": round(kpis.get("customer_conversion_rate", 0.0), 2), "unit": "%"},
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# -------------------------
# Payments KPIs (RPC)
# -------------------------
@router.get("/payments", response_model=List[Dict[str, Any]])
async def get_payment_kpis(date_range: Tuple[datetime, datetime] = Depends(get_global_time_filter)):
    """Payment KPIs"""
    start_time, end_time = date_range
    try:
        response = supabase.rpc(
            'get_all_payment_kpis',
            {
                'p_start_time': start_time,
                'p_end_time': end_time,
                'p_interval': GLOBAL_TIME_FILTER.get("period", "all_time")
            }
        ).execute()

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
    """Returns AI-related call analysis KPIs (filtered by global time range)."""
    start_time, end_time = date_range

    try:
        query = supabase.table("call").select("conv_id, date_time")

        if start_time and end_time:
            query = query.gte("date_time", start_time).lte("date_time", end_time)

        call_resp = query.execute()
        conv_ids = [r["conv_id"] for r in call_resp.data or []]

        if not conv_ids:
            return {"llmkpi": [], "message": "No calls found in selected time range."}

        response = supabase.table("call_analysis").select("*").in_("conv_id", conv_ids).execute()
        records = response.data or []

        if not records:
            return {"llmkpi": [], "message": "No AI analysis data found in selected period."}

        total_calls = len(records)
        ai_calls = sum(1 for r in records if r.get("ai_detect_flag"))
        human_calls = sum(1 for r in records if r.get("human_agent_flag"))
        out_of_scope_calls = sum(1 for r in records if r.get("out_of_scope"))
        ai_success_calls = sum(1 for r in records if r.get("ai_detect_flag") and not r.get("failed_conversion_reason"))

        llmkpi = [
            {"name": "AI Detection Rate", "value": round((ai_calls / total_calls) * 100, 2) if total_calls else 0},
            {"name": "Human Agent Involvement Rate", "value": round((human_calls / total_calls) * 100, 2) if total_calls else 0},
            {"name": "Out-of-Scope Rate", "value": round((out_of_scope_calls / total_calls) * 100, 2) if total_calls else 0},
            {"name": "AI Success Rate", "value": round((ai_success_calls / ai_calls) * 100, 2) if ai_calls else 0},
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
    """Returns key chart datasets for visual analytics."""
    start_time, end_time = date_range

    try:
        query = supabase.table("call").select("conv_id, date_time")
        if start_time and end_time:
            query = query.gte("date_time", start_time).lte("date_time", end_time)

        call_response = query.execute()
        call_data = call_response.data or []
        conv_ids = [r["conv_id"] for r in call_data]

        if not conv_ids:
            return {"charts": [], "message": "No calls found in selected range."}

        analysis_response = supabase.table("call_analysis").select("*").in_("conv_id", conv_ids).execute()
        analysis_data = analysis_response.data or []

        if not call_data or not analysis_data:
            return {"charts": [], "message": "No data available for this range."}

        call_date_map = {row["conv_id"]: row.get("date_time") for row in call_data if row.get("date_time")}
        analysis_records = [
            {**row, "date_time": call_date_map[row["conv_id"]]} for row in analysis_data if row.get("conv_id") in call_date_map
        ]

        # Chart 1
        volume_by_date = defaultdict(int)
        for r in analysis_records:
            if r.get("date_time"):
                volume_by_date[r["date_time"].split("T")[0]] += 1

        chart1 = {"title": "Analysis Volume Over Time", "x_axis": list(volume_by_date.keys()), "y_axis": list(volume_by_date.values()), "chart_type": "line"}

        # Chart 2
        sentiment_by_reason = defaultdict(list)
        for r in analysis_records:
            reason = r.get("failed_conversion_reason")
            if reason:
                try:
                    sentiment_by_reason[reason].append(float(r.get("sentiment_score") or 0))
                except (TypeError, ValueError):
                    continue

        avg_sentiment = {reason: round(sum(vals) / len(vals), 3) for reason, vals in sentiment_by_reason.items() if vals}
        chart2 = {"title": "Average Sentiment by Failed Conversion Reason", "x_axis": list(avg_sentiment.keys()), "y_axis": list(avg_sentiment.values()), "chart_type": "bar"}

        # Chart 3
        ai_by_week = defaultdict(lambda: {"ai": 0, "total": 0})
        for r in analysis_records:
            if r.get("date_time"):
                date_obj = datetime.fromisoformat(r["date_time"].split("T")[0])
                week_start = date_obj.strftime("%Y-%W")
                ai_by_week[week_start]["total"] += 1
                if r.get("ai_detect_flag"):
                    ai_by_week[week_start]["ai"] += 1

        ai_trend = {week: round((vals["ai"] / vals["total"]) * 100, 2) for week, vals in ai_by_week.items() if vals["total"] > 0}
        chart3 = {"title": "AI Detection Trend Over Time", "x_axis": list(ai_trend.keys()), "y_axis": list(ai_trend.values()), "chart_type": "line"}

        return {"charts": [chart1, chart2, chart3]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chart data: {str(e)}")
