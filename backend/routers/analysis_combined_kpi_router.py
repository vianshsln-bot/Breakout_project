# routers/kpi_router.py
import enum
from fastapi import FastAPI, APIRouter, HTTPException, Query, status, Depends
from typing import List, Dict, Any, Optional, Tuple
from datetime import timedelta, datetime
from backend.config.supabase_client import supabase
from collections import defaultdict

router = APIRouter(prefix="/kpis", tags=["KPIs"])

# ------------------------------------------------------------
# ⏱️ GLOBAL TIME FILTER HANDLING
# ------------------------------------------------------------
class TimePeriod(str, enum.Enum):
    today = "today"
    last_week = "last_week"
    last_month = "last_month"
    all_time = "all_time"

GLOBAL_TIME_FILTER = {
    "period": TimePeriod.all_time,
    "start_date": None,
    "end_date": None
}

def compute_date_range(
    filter: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Tuple[Optional[str], Optional[str]]:
    """Compute start and end date based on filter."""
    today = datetime.utcnow().date()
    if start_date and end_date:
        s = datetime.strptime(start_date, "%Y-%m-%d").date()
        e = datetime.strptime(end_date, "%Y-%m-%d").date()
        GLOBAL_TIME_FILTER.update({"period": None, "start_date": s, "end_date": e})
        return s.isoformat(), e.isoformat()

    selected_filter = filter or GLOBAL_TIME_FILTER.get("period", TimePeriod.all_time)
    if selected_filter == TimePeriod.today:
        start, end = today, today
    elif selected_filter == TimePeriod.last_week:
        start, end = today - timedelta(days=7), today
    elif selected_filter == TimePeriod.last_month:
        start, end = today - timedelta(days=30), today
    else:
        return None, None

    GLOBAL_TIME_FILTER.update({"period": selected_filter, "start_date": start, "end_date": end})
    return start.isoformat(), end.isoformat()

def get_global_time_filter(
    filter: Optional[TimePeriod] = Query(None, description="Time period filter"),
    start_date: Optional[str] = Query(None, description="Custom range start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Custom range end date (YYYY-MM-DD)")
) -> Tuple[Optional[str], Optional[str]]:
    return compute_date_range(filter, start_date, end_date)

# ------------------------------------------------------------
# ✅ SINGLE COMBINED ENDPOINT
# ------------------------------------------------------------
@router.get("/all")
async def get_all_kpis(
    date_range: Tuple[Optional[str], Optional[str]] = Depends(get_global_time_filter)
):
    start_time, end_time = date_range

    try:
        # ---------------------- BOOKINGS ----------------------
        booking_data = []
        try:
            resp = supabase.rpc("get_booking_metrics", {
                "p_start_time": start_time,
                "p_end_time": end_time
            }).execute()
            if resp.data:
                b = resp.data[0]
                booking_data = [
                    {"name": "total_bookings", "value": b.get("total_bookings", 0)},
                    {"name": "booking_conversion_rate", "value": b.get("booking_conversion_rate", 0), "unit": "%"},
                    {"name": "avg_booking_value", "value": b.get("avg_booking_value", 0), "unit": "currency"},
                    {"name": "cancellation_rate", "value": b.get("cancellation_rate", 0), "unit": "%"},
                    {"name": "repeat_booking_rate", "value": b.get("repeat_booking_rate", 0), "unit": "%"},
                    {"name": "total_gross_revenue", "value": b.get("total_gross_revenue", 0), "unit": "currency"},
                    {"name": "total_collections", "value": b.get("total_collections", 0), "unit": "currency"},
                ]
        except Exception as e:
            booking_data = [{"error": f"Bookings error: {str(e)}"}]

        # ---------------------- LEADS ----------------------
        leads_data = []
        try:
            resp = supabase.rpc("get_all_lead_kpis", {
                "p_start_time": start_time,
                "p_end_time": end_time
            }).execute()
            if resp.data:
                l = resp.data[0]
                leads_data = [
                    {"name": "total_leads_generated", "value": l.get("total_leads_generated", 0)},
                    {"name": "lead_conversion_rate", "value": l.get("lead_conversion_rate", 0), "unit": "%"},
                    {"name": "avg_lead_response_time", "value": l.get("avg_lead_response_time", 0), "unit": "hours"},
                    {"name": "best_lead_source", "value": l.get("best_lead_source", "N/A")},
                    {"name": "qualified_lead_ratio", "value": l.get("qualified_lead_ratio", 0), "unit": "%"},
                ]
        except Exception as e:
            leads_data = [{"error": f"Leads error: {str(e)}"}]

        # ---------------------- CUSTOMERS ----------------------
        customers_data = []
        try:
            resp = supabase.rpc("get_all_cust_kpis", {
                "p_start_time": start_time,
                "p_end_time": end_time
            }).execute()
            if resp.data:
                c = resp.data[0]
                customers_data = [
                    {"name": "total_customers", "value": c.get("total_customers", 0)},
                    {"name": "new_customers", "value": c.get("new_customers", 0)},
                    {"name": "avg_spend_per_customer", "value": c.get("avg_spend_per_customer", 0), "unit": "currency"},
                    {"name": "customer_conversion_rate", "value": c.get("customer_conversion_rate", 0), "unit": "%"},
                ]
        except Exception as e:
            customers_data = [{"error": f"Customers error: {str(e)}"}]

        # ---------------------- PAYMENTS ----------------------
        payments_data = []
        try:
            resp = supabase.rpc("get_all_payment_kpis", {
                "p_start_time": start_time,
                "p_end_time": end_time
            }).execute()
            if resp.data:
                p = resp.data[0]
                payments_data = [
                    {"name": "total_revenue_collected", "value": p.get("total_revenue_collected", 0), "unit": "currency"},
                    {"name": "outstanding_payments", "value": p.get("outstanding_payments", 0), "unit": "currency"},
                    {"name": "avg_payment_value", "value": p.get("avg_payment_value", 0), "unit": "currency"},
                    {"name": "revenue_growth_rate", "value": p.get("revenue_growth_rate", 0), "unit": "%"},
                    {"name": "refund_chargeback_rate", "value": p.get("refund_chargeback_rate", 0), "unit": "%"},
                ]
        except Exception as e:
            payments_data = [{"error": f"Payments error: {str(e)}"}]

        # ---------------------- LLM KPI ----------------------
        llm_kpis = []
        try:
            query = supabase.table("call").select("conv_id, date_time")
            if start_time and end_time:
                query = query.gte("date_time", start_time).lte("date_time", end_time)
            call_resp = query.execute()
            conv_ids = [r["conv_id"] for r in call_resp.data or []]
            if conv_ids:
                resp = supabase.table("call_analysis").select("*").in_("conv_id", conv_ids).execute()
                data = resp.data or []
                total = len(data)
                ai_calls = sum(1 for d in data if d.get("ai_detect_flag"))
                human_calls = sum(1 for d in data if d.get("human_agent_flag"))
                out_scope = sum(1 for d in data if d.get("out_of_scope"))
                ai_success = sum(1 for d in data if d.get("ai_detect_flag") and not d.get("failed_conversion_reason"))

                llm_kpis = [
                    {"name": "AI Detection Rate", "value": round((ai_calls / total) * 100, 2) if total else 0},
                    {"name": "Human Agent Involvement Rate", "value": round((human_calls / total) * 100, 2) if total else 0},
                    {"name": "Out-of-Scope Rate", "value": round((out_scope / total) * 100, 2) if total else 0},
                    {"name": "AI Success Rate", "value": round((ai_success / ai_calls) * 100, 2) if ai_calls else 0},
                ]
        except Exception as e:
            llm_kpis = [{"error": f"LLM KPI error: {str(e)}"}]

        # ---------------------- CHARTS ----------------------
        charts = []
        try:
            call_query = supabase.table("call").select("conv_id, date_time")
            if start_time and end_time:
                call_query = call_query.gte("date_time", start_time).lte("date_time", end_time)
            call_resp = call_query.execute()
            call_data = call_resp.data or []
            conv_ids = [r["conv_id"] for r in call_data]

            if conv_ids:
                resp = supabase.table("call_analysis").select("*").in_("conv_id", conv_ids).execute()
                data = resp.data or []
                call_map = {r["conv_id"]: r.get("date_time") for r in call_data}

                records = [{**r, "date_time": call_map.get(r["conv_id"])} for r in data if r.get("conv_id") in call_map]

                # Chart 1: Volume
                vol = defaultdict(int)
                for r in records:
                    if r.get("date_time"):
                        vol[r["date_time"].split("T")[0]] += 1
                chart1 = {"title": "Analysis Volume Over Time", "x_axis": list(vol.keys()), "y_axis": list(vol.values()), "chart_type": "line"}

                # Chart 2: Sentiment
                sent = defaultdict(list)
                for r in records:
                    reason = r.get("failed_conversion_reason")
                    if reason:
                        try:
                            sent[reason].append(float(r.get("sentiment_score") or 0))
                        except:
                            continue
                avg_sent = {k: round(sum(v) / len(v), 3) for k, v in sent.items() if v}
                chart2 = {"title": "Average Sentiment by Failed Conversion Reason", "x_axis": list(avg_sent.keys()), "y_axis": list(avg_sent.values()), "chart_type": "bar"}

                # Chart 3: AI Trend
                ai_by_week = defaultdict(lambda: {"ai": 0, "total": 0})
                for r in records:
                    if r.get("date_time"):
                        dt = datetime.fromisoformat(r["date_time"].split("T")[0])
                        week = dt.strftime("%Y-%W")
                        ai_by_week[week]["total"] += 1
                        if r.get("ai_detect_flag"):
                            ai_by_week[week]["ai"] += 1
                ai_trend = {w: round((v["ai"] / v["total"]) * 100, 2) for w, v in ai_by_week.items() if v["total"]}
                chart3 = {"title": "AI Detection Trend Over Time", "x_axis": list(ai_trend.keys()), "y_axis": list(ai_trend.values()), "chart_type": "line"}

                # -------------------
                # Chart 4: Revenue Summary
                # -------------------
                try:
                    revenue_data = get_revenue_summary(tr_param(GLOBAL_TIME_FILTER["period"]))
                    chart4 = {
                        "title": "Revenue Summary",
                        "data": revenue_data,
                        "chart_type": "bar"
                    }
                except Exception as e:
                    chart4 = {"error": f"Revenue Summary error: {str(e)}"}

                # -------------------
                # Chart 5: Payments Status Breakdown
                # -------------------
                try:
                    payments_data = get_payments_status(tr_param(GLOBAL_TIME_FILTER["period"]))
                    chart5 = {
                        "title": "Payments Status Breakdown",
                        "data": payments_data,
                        "chart_type": "pie"
                    }
                except Exception as e:
                    chart5 = {"error": f"Payments Status error: {str(e)}"}

                # -------------------
                # Chart 6: Lead Conversion Funnel
                # -------------------
                try:
                    funnel_data = get_lead_funnel(tr_param(GLOBAL_TIME_FILTER["period"]))
                    chart6 = {
                        "title": "Lead Conversion Funnel",
                        "data": funnel_data,
                        "chart_type": "funnel"
                    }
                except Exception as e:
                    chart6 = {"error": f"Lead Funnel error: {str(e)}"}
        
                # combine all
                charts = [chart1, chart2, chart3, chart4, chart5, chart6]
        except Exception as e:
            charts = [{"error": f"Charts error: {str(e)}"}]

        # ---------------------- FINAL COMBINED RESPONSE ----------------------
        return {
            "filters": {"start_time": start_time, "end_time": end_time},
            "bookings": booking_data,
            "leads": leads_data,
            "customers": customers_data,
            "payments": payments_data,
            "llmkpi": llm_kpis,
            "charts": charts
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching all KPIs: {str(e)}")
