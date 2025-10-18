# routers/kpi_router.py
import enum
from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Dict, Any
from datetime import timedelta, datetime, timezone
from backend.config.supabase_client import supabase

router = APIRouter(prefix="/kpis", tags=["KPIs"])




class TimePeriod(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    half_yearly = "half_yearly"
    yearly = "yearly"


@router.get("/customers", response_model=List[Dict[str, Any]])
async def get_customer_kpis(
    # 2. Add the time_period as a query parameter
    # It will default to 'monthly' if not provided
    time_period: TimePeriod = Query("monthly", description="Set the period for 'new_customers' count")
):
    """
    Returns customer KPIs:
    - Total Customers
    - New Customers (for the selected period)
    - Average Spend per Customer
    - Customer Conversion Rate
    """
    try:
        # 3. Pass the parameter to your RPC call
        params = {'time_period': time_period.value}
        response = supabase.rpc('get_all_customer_kpis', params).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No KPI data found.")

        kpis = response.data[0]

        return [
            {"name": "total_customers", "value": kpis['total_customers']},
            # This value is now dynamic based on the time_period
            {"name": "new_customers", "value": kpis['new_customers']},
            {"name": "avg_spend_per_customer", "value": round(kpis['avg_spend_per_customer'], 2), "unit": "currency"},
            {"name": "customer_conversion_rate", "value": round(kpis['customer_conversion_rate'], 2), "unit": "%"}
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
    
@router.get("/leads", response_model=List[Dict[str, Any]])
async def get_lead_kpis():
    """
    Returns lead KPIs:
    - Total Leads Generated
    - Lead Conversion Rate
    - Lead Response Time
    - Lead Source Effectiveness
    - Qualified Lead Ratio
    """
    try:
        # This call remains exactly the same
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

@router.get("/bookings", response_model=List[Dict[str, Any]])
async def get_booking_kpis():
    """
    Returns booking KPIs:
    - Total Bookings
    - Booking Conversion Rate
    - Average Booking Value (ABV)
    - Cancellation Rate
    - Repeat Booking Rate
    """
    try:
        # Call your new function one time
        response = supabase.rpc('get_all_booking_kpis').execute()
        
        # The result is the first item in the data list
        kpis = response.data[0]

        return [
            {"name": "total_bookings", "value": kpis['total_bookings']},
            {"name": "booking_conversion_rate", "value": round(kpis['booking_conversion_rate'], 2), "unit": "%"},
            {"name": "avg_booking_value", "value": round(kpis['avg_booking_value'], 2), "unit": "currency"},
            {"name": "cancellation_rate", "value": round(kpis['cancellation_rate'], 2), "unit": "%"},
            {"name": "repeat_booking_rate", "value": round(kpis['repeat_booking_rate'], 2), "unit": "%"},
        ]
        
    except Exception as e:
        # Handle cases where the rpc might fail or return no data
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No KPI data found.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))



@router.get("/payments", response_model=List[Dict[str, Any]])
async def get_payment_kpis(
    # Add the time_period query parameter
    time_period: TimePeriod = Query("monthly", description="Set the period for 'Revenue Growth Rate'")
):
    """
    Returns payment analytics KPIs:
    - Total Revenue Collected
    - Outstanding/Pending Payments
    - Average Payment Value
    - Revenue Growth Rate (dynamic based on time_period)
    - Refund/Chargeback Rate
    """
    try:
        # Pass the parameter to your RPC call
        params = {'time_period': time_period.value}
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


@router.get("/llmkpi")
def get_analysis_llmkpis():
    """
    Returns AI-related call analysis KPIs.
    """
    try:
        # Fetch data from Supabase call_analysis table
        response = supabase.table("call_analysis").select("*").execute()
        records = response.data or []

        if not records:
            return {"llmkpi": []}

        total_calls = len(records)
        ai_calls = sum(1 for r in records if r.get("ai_detect_flag"))
        human_calls = sum(1 for r in records if r.get("human_agent_flag"))
        out_of_scope_calls = sum(1 for r in records if r.get("out_of_scope"))
        ai_success_calls = sum(
            1 for r in records if r.get("ai_detect_flag") and not r.get("failed_conversion_reason")
        )

        # Compute metrics
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


@router.get("/charts")
def get_analysis_charts():
    """
    Returns key chart datasets for visual analytics.
    """
    try:
        # Fetch joined call + call_analysis data
        query = supabase.rpc("get_call_analysis_joined").execute() if hasattr(supabase, "rpc") else supabase.table("call_analysis").select("*").execute()
        analysis_records = query.data or []

        if not analysis_records:
            return {"charts": []}

        # Chart 1: Analysis Volume Over Time
        volume_by_date = defaultdict(int)
        for r in analysis_records:
            # You'll need to also fetch `date_time` from call table
            if "date_time" in r:
                date_str = r["date_time"].split("T")[0]
                volume_by_date[date_str] += 1

        chart1 = {
            "title": "Analysis Volume Over Time",
            "description": "Calls analyzed per day",
            "x_axis": list(volume_by_date.keys()),
            "y_axis": list(volume_by_date.values()),
            "chart_type": "line"
        }

        # Chart 2: Average Sentiment by Failed Conversion Reason
        sentiment_by_reason = defaultdict(list)
        for r in analysis_records:
            reason = r.get("failed_conversion_reason")
            if reason:
                sentiment_by_reason[reason].append(float(r.get("sentiment_score", 0)))

        avg_sentiment = {
            reason: sum(vals) / len(vals)
            for reason, vals in sentiment_by_reason.items()
        }

        chart2 = {
            "title": "Average Sentiment by Failed Conversion Reason",
            "x_axis": list(avg_sentiment.keys()),
            "y_axis": [round(v, 3) for v in avg_sentiment.values()],
            "chart_type": "bar"
        }

        # Chart 3: AI Detection Trend Over Time (weekly)
        ai_by_week = defaultdict(lambda: {"ai": 0, "total": 0})
        for r in analysis_records:
            if "date_time" in r:
                date_obj = datetime.fromisoformat(r["date_time"].split("T")[0])
                week_start = date_obj.strftime("%Y-%W")  # Year-Week format
                ai_by_week[week_start]["total"] += 1
                if r.get("ai_detect_flag"):
                    ai_by_week[week_start]["ai"] += 1

        ai_trend = {
            week: (vals["ai"] / vals["total"]) * 100
            for week, vals in ai_by_week.items()
            if vals["total"] > 0
        }

        chart3 = {
            "title": "AI Detection Trend Over Time",
            "x_axis": list(ai_trend.keys()),
            "y_axis": [round(v, 2) for v in ai_trend.values()],
            "chart_type": "line"
        }

        return {"charts": [chart1, chart2, chart3]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chart data: {e}")
