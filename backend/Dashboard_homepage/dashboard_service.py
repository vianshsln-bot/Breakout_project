from supabase_client import supabase
from datetime import datetime
from collections import defaultdict

# --- 1. Calls Trend ---
def get_calls_trend():
    response = supabase.table("call").select("date_time").execute()
    data = response.data or []

    daily_counts = defaultdict(int)
    for row in data:
        date_str = row["date_time"][:10]  # extract YYYY-MM-DD
        daily_counts[date_str] += 1

    return {"dates": list(daily_counts.keys()), "calls": list(daily_counts.values())}

# --- 2. Bookings Trend ---
def get_bookings_trend():
    query = supabase.table("booking").select("booking_date, booking_status, payment_id").execute()
    bookings = query.data or []

    result = defaultdict(lambda: {"bookings": 0, "revenue": 0})
    for b in bookings:
        if b["booking_status"].lower() == "booked":
            date_str = b["booking_date"][:10]
            result[date_str]["bookings"] += 1
            if b["payment_id"]:
                payment = supabase.table("payment").select("payment_amount").eq("payment_id", b["payment_id"]).execute()
                if payment.data:
                    result[date_str]["revenue"] += float(payment.data[0]["payment_amount"])

    return {
        "dates": list(result.keys()),
        "bookings": [v["bookings"] for v in result.values()],
        "revenue": [v["revenue"] for v in result.values()]
    }

# --- 3. Lead Funnel ---
def get_lead_funnel():
    leads = supabase.table("leads").select("status").execute().data or []
    funnel = defaultdict(int)
    for lead in leads:
        funnel[lead["status"]] += 1
    return {"stages": list(funnel.keys()), "counts": list(funnel.values())}

# --- 4. Lead Source Effectiveness ---
def get_lead_sources():
    leads = supabase.table("leads").select("source, status").execute().data or []
    sources = defaultdict(int)
    for l in leads:
        if l["status"].lower() == "converted":
            sources[l["source"]] += 1
    return {"sources": list(sources.keys()), "conversions": list(sources.values())}

# --- 5. Customer Growth ---
def get_customer_growth():
    customers = supabase.table("customers").select("customer_since").execute().data or []
    daily_new = defaultdict(int)
    for c in customers:
        date_str = c["customer_since"][:10]
        daily_new[date_str] += 1

    total = 0
    cumulative = []
    for d in daily_new.values():
        total += d
        cumulative.append(total)

    return {"dates": list(daily_new.keys()), "new_customers": list(daily_new.values()), "total": cumulative}

# --- 6. Customer Segments / Locations ---
def get_customer_segments():
    data = supabase.table("customers").select("address").execute().data or []
    segments = defaultdict(int)
    for c in data:
        city = c["address"].split(",")[-1].strip() if c.get("address") else "Unknown"
        segments[city] += 1
    return {"segments": list(segments.keys()), "counts": list(segments.values())}

# --- 7. Revenue vs Refunds ---
def get_revenue_summary():
    payments = supabase.table("payment").select("payment_amount, payment_status, payment_id").execute().data or []
    daily = defaultdict(lambda: {"revenue": 0, "refunds": 0})
    for p in payments:
        date = datetime.utcnow().strftime("%Y-%m-%d")  # simplified
        if p["payment_status"].lower() == "refunded":
            daily[date]["refunds"] += float(p["payment_amount"])
        else:
            daily[date]["revenue"] += float(p["payment_amount"])
    return {"dates": list(daily.keys()), "revenue": [v["revenue"] for v in daily.values()], "refunds": [v["refunds"] for v in daily.values()]}

# --- 8. Payments Status ---
def get_payments_status():
    payments = supabase.table("payment").select("payment_status, payment_amount").execute().data or []
    totals = defaultdict(float)
    for p in payments:
        totals[p["payment_status"].capitalize()] += float(p["payment_amount"])
    return dict(totals)

# --- 9. Call Sentiment ---
def get_sentiment_summary():
    calls = supabase.table("call_analysis").select("sentiment_score").execute().data or []
    pos, neu, neg = 0, 0, 0
    for c in calls:
        if c["sentiment_score"] >= 0.6:
            pos += 1
        elif c["sentiment_score"] >= 0.3:
            neu += 1
        else:
            neg += 1
    return {"positive": pos, "neutral": neu, "negative": neg}

# --- 10. Customer Satisfaction ---
def get_satisfaction():
    ratings = supabase.table("call_analysis").select("customer_rating").execute().data or []
    daily = defaultdict(list)
    for r in ratings:
        date = datetime.utcnow().strftime("%Y-%m-%d")
        if r["customer_rating"]:
            daily[date].append(r["customer_rating"])

    avg_nps = {d: sum(vals)/len(vals) for d, vals in daily.items()}
    return {"dates": list(avg_nps.keys()), "nps": [round(v, 2) for v in avg_nps.values()]}

# --- 11. Combined Overview ---
def get_overview():
    return {
        "calls_trend": get_calls_trend(),
        "bookings_trend": get_bookings_trend(),
        "lead_funnel": get_lead_funnel(),
        "lead_sources": get_lead_sources(),
        "customer_growth": get_customer_growth(),
        "customer_segments": get_customer_segments(),
        "revenue_summary": get_revenue_summary(),
        "payments_status": get_payments_status(),
        "sentiment_summary": get_sentiment_summary(),
        "satisfaction": get_satisfaction()
    }
