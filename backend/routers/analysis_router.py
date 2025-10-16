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