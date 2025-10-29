from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Optional, Tuple
from zoneinfo import ZoneInfo

from backend.config.supabase_client import supabase

# --- Time range helpers ---

ALLOWED_RANGES = {"today", "last_week", "last_month", "all_time"}

def get_time_bounds(time_range: str, tz_name: str = "Asia/Kolkata") -> Tuple[Optional[str], Optional[str]]:
    """
    Returns (start_iso_utc, end_iso_utc) for the requested time_range based on tz_name.
    start is inclusive, end is exclusive.
    For all_time, returns (None, None).
    """
    if time_range not in ALLOWED_RANGES:
        time_range = "all_time"

    if time_range == "all_time":
        return None, None

    tz = ZoneInfo(tz_name)
    now_local = datetime.now(tz)

    if time_range == "today":
        start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == "last_week":
        start_local = (now_local - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == "last_month":
        start_local = (now_local - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start_local = None  # unreachable

    end_local = now_local

    start_utc = start_local.astimezone(timezone.utc).isoformat()
    end_utc = end_local.astimezone(timezone.utc).isoformat()
    return start_utc, end_utc


def apply_range_filter(query, column: str, start_iso: Optional[str], end_iso: Optional[str]):
    """
    Applies gte/lt filters to a Supabase query for a given timestamp column.
    """
    if start_iso:
        query = query.gte(column, start_iso)
    if end_iso:
        query = query.lt(column, end_iso)
    return query


def sort_counts_dict(d: dict) -> Tuple[list, list]:
    """
    Returns sorted keys and aligned values for date-keyed dicts.
    """
    dates = sorted(d.keys())
    vals = [d[k] for k in dates]
    return dates, vals


# --- 1. Calls Trend ---
def get_calls_trend(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = supabase.table("call").select("date_time")
    query = apply_range_filter(query, "date_time", start_iso, end_iso)
    response = query.execute()
    data = response.data or []

    daily_counts = defaultdict(int)
    for row in data:
        dt = row.get("date_time")
        if not dt:
            continue
        date_str = dt[:10]  # YYYY-MM-DD from ISO
        daily_counts[date_str] += 1

    dates, counts = sort_counts_dict(daily_counts)
    return {"dates": dates, "calls": counts}


# --- 2. Bookings Trend ---
def get_bookings_trend(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = supabase.table("bookings").select("start_time, status")
    query = apply_range_filter(query, "start_time", start_iso, end_iso)
    bookings = query.execute().data or []

    daily_counts = defaultdict(int)
    for b in bookings:
        start_time = b.get("start_time")
        status = (b.get("status") or "").lower()
        if not start_time or not status:
            continue
        if status == "confirmed":
            date_str = start_time.split("T")[0]
            daily_counts[date_str] += 1

    dates, counts = sort_counts_dict(daily_counts)
    return {"dates": dates, "bookings": counts}


# --- 3. Lead Funnel ---
def get_lead_funnel(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = supabase.table("leads").select("status, created_at")
    query = apply_range_filter(query, "created_at", start_iso, end_iso)
    leads = query.execute().data or []

    funnel = defaultdict(int)
    for lead in leads:
        status = lead.get("status")
        if status:
            funnel[status] += 1
    return {"stages": list(funnel.keys()), "counts": list(funnel.values())}


# --- 4. Lead Source Effectiveness ---
def get_lead_sources(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = supabase.table("leads").select("source, status, created_at")
    query = apply_range_filter(query, "created_at", start_iso, end_iso)
    leads = query.execute().data or []

    sources = defaultdict(int)
    for l in leads:
        status = (l.get("status") or "").lower()
        if status == "converted":
            src = l.get("source") or "Unknown"
            sources[src] += 1
    return {"sources": list(sources.keys()), "conversions": list(sources.values())}


# --- 5. Customer Growth ---
def get_customer_growth(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = supabase.table("customers").select("customer_since")
    query = apply_range_filter(query, "customer_since", start_iso, end_iso)
    customers = query.execute().data or []

    daily_new = defaultdict(int)
    for c in customers:
        since = c.get("customer_since")
        if not since:
            continue
        date_str = since[:10]
        daily_new[date_str] += 1

    # cumulative growth in chronological order
    dates, new_counts = sort_counts_dict(daily_new)
    total = 0
    cumulative = []
    for d in dates:
        total += daily_new[d]
        cumulative.append(total)

    return {"dates": dates, "new_customers": new_counts, "total": cumulative}


# --- 6. Customer Segments / Locations ---
def get_customer_segments(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = supabase.table("customers").select("address, customer_since")
    query = apply_range_filter(query, "customer_since", start_iso, end_iso)
    data = query.execute().data or []

    segments = defaultdict(int)
    for c in data:
        addr = c.get("address") or ""
        city = addr.split(",")[-1].strip() if addr else "Unknown"
        segments[city] += 1
    return {"segments": list(segments.keys()), "counts": list(segments.values())}




# --- Revenue Summary (time-range aware) ---
def get_revenue_summary(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    # total_revenue := sum(bookings.total_net)
    # total_received := sum(bookings.total_paid)
    # total_dues := total_revenue - total_received
    start_iso, end_iso = get_time_bounds(time_range, tz_name)

    # Filter by the booking's start_time; switch to created_at if that matches your business logic better.
    query = (
        supabase
        .table("bookings")
        .select("total_net, total_paid, start_time")
    )
    query = apply_range_filter(query, "start_time", start_iso, end_iso)
    rows = query.execute().data or []

    total_revenue = 0.0
    total_received = 0.0

    for r in rows:
        total_revenue += float(r.get("total_net") or 0)
        total_received += float(r.get("total_paid") or 0)

    total_dues = total_revenue - total_received

    return {
        "total_revenue": round(total_revenue, 2),
        "total_received": round(total_received, 2),
        "total_dues": round(total_dues, 2),
    }

# --- 8. Payments Status ---
def get_payments_status(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = supabase.table("payment").select("payment_status, payment_amount, creation_time")
    query = apply_range_filter(query, "creation_time", start_iso, end_iso)
    payments = query.execute().data or []

    totals = defaultdict(float)
    for p in payments:
        status = (p.get("payment_status") or "").capitalize() or "Unknown"
        totals[status] += float(p.get("payment_amount") or 0)
    return dict(totals)

# --- 9. Call Sentiment ---
def get_sentiment_summary(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)

    # Join call_analysis -> call and filter by call.date_time
    query = (
        supabase
        .table("call_analysis")
        .select("sentiment_score, call!inner(date_time)")
    )
    query = apply_range_filter(query, "call.date_time", start_iso, end_iso)
    calls = query.execute().data or []

    pos, neu, neg = 0, 0, 0
    for c in calls:
        s_raw = c.get("sentiment_score")
        if s_raw is None:
            continue
        s = float(s_raw)
        if s >= 0.6:
            pos += 1
        elif s >= 0.3:
            neu += 1
        else:
            neg += 1

    return {"positive": pos, "neutral": neu, "negative": neg}


# --- 10. Customer Satisfaction ---
def get_satisfaction(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    start_iso, end_iso = get_time_bounds(time_range, tz_name)

    # Join call_analysis -> call and filter by call.date_time
    query = (
        supabase
        .table("call_analysis")
        .select("customer_rating, call!inner(date_time)")
    )
    query = apply_range_filter(query, "call.date_time", start_iso, end_iso)
    ratings = query.execute().data or []

    daily = defaultdict(list)
    for r in ratings:
        call_obj = r.get("call") or {}
        dt = call_obj.get("date_time")
        rating = r.get("customer_rating")
        if dt and rating is not None:
            date_str = dt[:10]
            daily[date_str].append(float(rating))

    avg_nps = {d: (sum(vals) / len(vals)) for d, vals in daily.items() if vals}
    dates = sorted(avg_nps.keys())
    nps = [round(avg_nps[d], 2) for d in dates]
    return {"dates": dates, "nps": nps}


from collections import defaultdict

# --- Customer Rating Summary ---
def get_customer_rating_summary(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    # Join call_analysis -> call and filter by call.date_time
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = (
        supabase
        .table("call_analysis")
        .select("customer_rating, call!inner(date_time)")
    )
    query = apply_range_filter(query, "call.date_time", start_iso, end_iso)
    rows = query.execute().data or []

    counts = defaultdict(int)
    total = 0.0
    n = 0

    for r in rows:
        rating = r.get("customer_rating")
        call_obj = r.get("call") or {}
        if rating is None or not call_obj.get("date_time"):
            continue
        counts[int(rating)] += 1
        total += float(rating)
        n += 1

    ratings_sorted = sorted(counts.keys())
    counts_list = [counts[k] for k in ratings_sorted]
    avg = round(total / n, 2) if n else 0.0

    return {
        "ratings": ratings_sorted,
        "counts": counts_list,
        "average": avg,
        "total_rated": n,
    }


# --- Call Intent Summary ---
def get_call_intent_summary(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    # Filter directly on call by date_time, then group by call_intent
    start_iso, end_iso = get_time_bounds(time_range, tz_name)
    query = (
        supabase
        .table("call")
        .select("call_intent, date_time")
    )
    query = apply_range_filter(query, "date_time", start_iso, end_iso)
    rows = query.execute().data or []

    intents = defaultdict(int)
    for r in rows:
        if not r.get("date_time"):
            continue
        intent = (r.get("call_intent") or "Unknown").strip() or "Unknown"
        intents[intent] += 1

    labels = sorted(intents.keys())
    counts = [intents[k] for k in labels]
    return {"intents": labels, "counts": counts}

# --- 11. Combined Overview ---
def get_overview(time_range: str = "all_time", tz_name: str = "Asia/Kolkata"):
    return {
        "calls_trend": get_calls_trend(time_range, tz_name),
        "bookings_trend": get_bookings_trend(time_range, tz_name),
        "lead_funnel": get_lead_funnel(time_range, tz_name),
        "lead_sources": get_lead_sources(time_range, tz_name),
        "customer_growth": get_customer_growth(time_range, tz_name),
        "revenue_summary": get_revenue_summary(time_range, tz_name),
        "payments_status": get_payments_status(time_range, tz_name),
        "sentiment_summary": get_sentiment_summary(time_range, tz_name),
        "satisfaction": get_satisfaction(time_range, tz_name),
        "customer_rating":get_customer_rating_summary(time_range,tz_name),
        "call_intent": get_call_intent_summary(time_range,tz_name)
    }
