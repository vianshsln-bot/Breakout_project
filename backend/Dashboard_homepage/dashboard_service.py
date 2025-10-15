from datetime import datetime
from collections import defaultdict
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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
from collections import defaultdict
from config.supabase_client import supabase

def get_bookings_trend():
    # Fetch start_time and status columns from the bookings table
    query = supabase.table("bookings").select("start_time, status").execute()
    bookings = query.data or []

    # Dictionary to hold count of bookings per date
    daily_counts = defaultdict(int)

    for b in bookings:
        start_time = b.get("start_time")
        status = b.get("status", "").lower()

        if not start_time or not status:
            continue  # Skip if data is incomplete

        if status == "booked":
            # Extract date (YYYY-MM-DD) from ISO timestamp format "2019-08-24T14:15:22Z"
            date_str = start_time.split("T")[0]
            daily_counts[date_str] += 1

    # Return structured response for frontend use
    return {
        "dates": list(daily_counts.keys()),
        "bookings": list(daily_counts.values())
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
