from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from datetime import timedelta, datetime,timezone
from backend.config.supabase_client import supabase

router = APIRouter(prefix="/kpis", tags=["KPIs"])


@router.get("/overview", response_model=List[Dict[str, Any]])
async def get_overview_kpis():
    """
    Returns top-level business KPIs:
    - total_revenue
    - total_customers
    - customer_growth_rate (MoM)
    - avg_revenue_per_customer
    """
    try:
        # Total revenue
        rev_res = supabase.table("payment").select("payment_amount").eq("payment_status", "completed").execute()
        total_revenue = sum(item["payment_amount"] for item in rev_res.data)

        # Total customers & new customers this month
        now = datetime.now(tz=timezone.utc)
        month_ago = now - timedelta(days=30)
        cust_res = supabase.table("customers").select("customer_since").execute()
        total_customers = len(cust_res.data)
        new_customers = sum(1 for c in cust_res.data if datetime.fromisoformat(c["customer_since"]) >= month_ago)
        customer_growth_rate = (new_customers / (total_customers - new_customers) * 100) if total_customers > new_customers else 100.0

        # Avg revenue per customer
        avg_rev_per_cust = (total_revenue / total_customers) if total_customers else 0.0

        return [
            {"name": "total_revenue", "value": total_revenue},
            {"name": "total_customers", "value": total_customers},
            {"name": "customer_growth_rate", "value": round(customer_growth_rate, 2), "unit": "%"},
            {"name": "avg_revenue_per_customer", "value": round(avg_rev_per_cust, 2)},
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/calls", response_model=List[Dict[str, Any]])
async def get_call_kpis():
    """
    Returns call-related KPIs:
    - total_calls
    - avg_call_duration
    - call_to_booking_conversion (%)
    - human_intervention_rate (%)
    """
    try:
        # Total calls and avg duration
        call_res = supabase.table("call").select("conv_id,duration").execute()
        total_calls = len(call_res.data)
        avg_duration = (sum(c["duration"] or 0 for c in call_res.data) / total_calls) if total_calls else 0

        # Call-to-booking conversion
        conv_ids = [c["conv_id"] for c in call_res.data]
        book_res = supabase.table("bookings").select("booking_id").in_("conv_id", conv_ids).eq("status", "confirmed").execute()
        conversion_rate = (len(book_res.data) / total_calls * 100) if total_calls else 0

        # Human intervention rate
        analysis_res = supabase.table("call_analysis").select("human_agent_flag").execute()
        human_flags = [a["human_agent_flag"] for a in analysis_res.data]
        human_rate = (sum(1 for f in human_flags if f) / len(human_flags) * 100) if human_flags else 0

        return [
            {"name": "total_calls", "value": total_calls},
            {"name": "avg_call_duration", "value": round(avg_duration, 2), "unit": "sec"},
            {"name": "call_to_booking_conversion", "value": round(conversion_rate, 2), "unit": "%"},
            {"name": "human_intervention_rate", "value": round(human_rate, 2), "unit": "%"},
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/customers", response_model=List[Dict[str, Any]])
async def get_customer_kpis():
    """
    Returns customer engagement KPIs:
    - retention_rate (%)
    - avg_bookings_per_customer
    - repeat_customer_rate (%)
    """
    try:
        # Bookings per customer
        b_res = supabase.table("bookings").select("customer_id").execute()
        cust_bookings: Dict[str, int] = {}
        for b in b_res.data:
            cid = b["customer_id"]
            cust_bookings[cid] = cust_bookings.get(cid, 0) + 1
        total_customers = len(cust_bookings)
        repeat_customers = sum(1 for cnt in cust_bookings.values() if cnt > 1)
        avg_bookings = (sum(cust_bookings.values()) / total_customers) if total_customers else 0
        repeat_rate = (repeat_customers / total_customers * 100) if total_customers else 0

        # Retention rate: customers with ≥2 bookings in last 90 days
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        recent_res = supabase.table("bookings").select("customer_id,creation_time").gte("creation_time", ninety_days_ago.isoformat()).execute()
        recent_counts: Dict[str, int] = {}
        for b in recent_res.data:
            cid = b["customer_id"]
            recent_counts[cid] = recent_counts.get(cid, 0) + 1
        retained = sum(1 for cnt in recent_counts.values() if cnt > 1)
        retention_rate = (retained / total_customers * 100) if total_customers else 0

        return [
            {"name": "retention_rate", "value": round(retention_rate, 2), "unit": "%"},
            {"name": "avg_bookings_per_customer", "value": round(avg_bookings, 2)},
            {"name": "repeat_customer_rate", "value": round(repeat_rate, 2), "unit": "%"},
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/leads", response_model=List[Dict[str, Any]])
async def get_lead_kpis():
    """
    Returns lead & booking funnel KPIs:
    - total_leads
    - lead_to_customer_conversion (%)
    - booking_confirmation_rate (%)
    """
    try:
        # Total leads
        lead_res = supabase.table("leads").select("lead_id,email").execute()
        total_leads = len(lead_res.data)

        # Lead-to-customer conversion
        emails = [l["email"] for l in lead_res.data]
        cust_res = supabase.table("customers").select("customer_id,email").in_("email", emails).execute()
        conversion = (len(cust_res.data) / total_leads * 100) if total_leads else 0

        # Booking confirmation rate
        book_res = supabase.table("bookings").select("status").execute()
        confirmed = sum(1 for b in book_res.data if b["status"] == "confirmed")
        confirmation_rate = (confirmed / len(book_res.data) * 100) if book_res.data else 0

        return [
            {"name": "total_leads", "value": total_leads},
            {"name": "lead_to_customer_conversion", "value": round(conversion, 2), "unit": "%"},
            {"name": "booking_confirmation_rate", "value": round(confirmation_rate, 2), "unit": "%"},
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
