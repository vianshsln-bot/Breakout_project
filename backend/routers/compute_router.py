from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
from postgrest import APIError
from backend.config.supabase_client import supabase


router = APIRouter(prefix="/compute", tags=["Compute Functions"])


def get_date_range(filter: Optional[str], start_date: Optional[str], end_date: Optional[str]):
    """
    Returns start and end dates based on filter.

    Args:
        filter: Predefined filter (today, last_week, last_month, all_time)
        start_date: Custom start date in YYYY-MM-DD format
        end_date: Custom end date in YYYY-MM-DD format

    Returns:
        Tuple of (start_date, end_date) or (None, None) for no filtering
    """
    today = datetime.utcnow().date()

    if filter == "today":
        return today, today
    elif filter == "last_week":
        return today - timedelta(days=7), today
    elif filter == "last_month":
        return today - timedelta(days=30), today
    elif filter == "all_time":
        return None, None  # no filtering applied
    elif start_date and end_date:
        try:
            return datetime.fromisoformat(start_date).date(), datetime.fromisoformat(end_date).date()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        return None, None


@router.get("/kpis")
def compute_kpis(
    filter: Optional[str] = Query(None, description="Filter by: today, last_week, last_month, all_time"),
    start_date: Optional[str] = Query(None, description="Custom start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Custom end date (YYYY-MM-DD)")
):
    """
    Compute KPIs using PostgreSQL function with optional date filtering.

    This endpoint calls the compute_kpis() SQL function which aggregates:
    - Call metrics (total, duration, missed)
    - Call analysis metrics (resolution, sentiment, abandonment)
    - Booking metrics (conversion rate)
    - Quality scores and customer ratings

    Date filters can be applied via:
    - Predefined filters: today, last_week, last_month, all_time
    - Custom date range: start_date and end_date parameters

    Returns:
        JSON with status and KPI data including all computed metrics
    """
    try:
        # Step 1: Determine date range
        start, end = get_date_range(filter, start_date, end_date)

        # Step 2: Call PostgreSQL function via RPC
        # Supabase RPC expects function name and parameters
        result = supabase.rpc(
            'compute_kpis',
            {
                'p_start_date': str(start) if start else None,
                'p_end_date': str(end) if end else None
            }
        ).execute()

        # Step 3: Extract KPI data from result
        if not result.data:
            raise HTTPException(status_code=500, detail="No data returned from compute_kpis function")

        kpi_data = result.data

        # Step 4: Add date filter metadata to response
        response_data = {
            **kpi_data,
            "date_filter_applied": {
                "filter": filter,
                "start_date": str(start) if start else None,
                "end_date": str(end) if end else None
            }
        }

        return {"status": "success", "kpis": response_data}

    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing KPIs: {str(e)}")
