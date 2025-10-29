# routers/kpi_router.py
from collections import defaultdict
from datetime import datetime
import enum
from typing import Optional, List, Dict, Any, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, status
from backend.config.supabase_client import supabase

router = APIRouter(prefix="/kpis", tags=["KPIs"])

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
def get_lead_kpis(
    interval: Interval = Query(..., description="today | last_week | last_month | all_time"),
    start_time: Optional[str] = Query(None, description="Start timestamp (ISO 8601 UTC, optional)"),
    end_time: Optional[str] = Query(None, description="End timestamp (ISO 8601 UTC, optional)")
):
    try:
        params = _build_params(interval, start_time, end_time)
        resp = supabase.rpc("get_all_lead_kpis", params).execute()
        data = resp.data or []
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No KPI data found.")
        kpis = data[0] if isinstance(data, list) else data

        return [
            {"name": "total_leads_generated", "value": kpis.get("total_leads_generated", 0)},
            {"name": "lead_conversion_rate", "value": round(kpis.get("lead_conversion_rate", 0.0), 2), "unit": "%"},
            {"name": "avg_lead_response_time", "value": round(kpis.get("avg_lead_response_time", 0.0), 2), "unit": "hours"},
            {"name": "best_lead_source", "value": kpis.get("best_lead_source")},
            {"name": "qualified_lead_ratio", "value": round(kpis.get("qualified_lead_ratio", 0.0), 2), "unit": "%"},
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

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
def get_payment_kpis(
    interval: Interval = Query(..., description="today | last_week | last_month | all_time"),
    start_time: Optional[str] = Query(None, description="Start timestamp (ISO 8601 UTC, optional)"),
    end_time: Optional[str] = Query(None, description="End timestamp (ISO 8601 UTC, optional)")
):
    try:
        params = _build_params(interval, start_time, end_time)
        resp = supabase.rpc("get_all_payment_kpis", params).execute()
        data = resp.data or []
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No KPI data found.")
        kpis = data[0] if isinstance(data, list) else data

        return [
            {"name": "total_revenue_collected", "value": round(kpis.get("total_revenue_collected", 0.0), 2), "unit": "currency"},
            {"name": "outstanding_payments", "value": round(kpis.get("outstanding_payments", 0.0), 2), "unit": "currency"},
            {"name": "avg_payment_value", "value": round(kpis.get("avg_payment_value", 0.0), 2), "unit": "currency"},
            {"name": "revenue_growth_rate", "value": round(kpis.get("revenue_growth_rate", 0.0), 2), "unit": "%"},
            {"name": "refund_chargeback_rate", "value": round(kpis.get("refund_chargeback_rate", 0.0), 2), "unit": "%"},
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


