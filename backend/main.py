from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your routers from the 'routers' directory
from backend.models.followup_model import FollowUp
from backend.routers import branch_router, call_analysis_router, \
call_router, consumption_router, customer_router, dashboard_router, employee_router,\
booking_router, event_router, followup_router, lead_router, linktracker_router,\
payment_router, payu_payments_router, scripts_router, slot_router, theme_router, compute_router2,bookeo_router,\
analysis_router, analysis_router2, elevenlabs_router,analysis_combined_kpi_router



# ----------------- App Initialization -----------------

# Create the main FastAPI application instance
app = FastAPI(
    title="Call & Booking Analytics API",
    description="This API powers the backend for managing employees, bookings, calls, and analytics.",
    version="1.0.0",
    contact={
        "name": "API Support",
        "email": "support@example.com",
    },
)

# ----------------- Middleware -----------------

# Define the list of origins that are allowed to make requests to this API.
# In a production environment, you should restrict this to your actual frontend domain.
origins = [
    "http://localhost",
    "http://localhost:3000", # Common for React frontends
    "http://localhost:8080", # Common for Vue frontends
    "http://localhost:4200", # Common for Angular frontends
    "http://localhost:9002",
    "*" # testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# ----------------- API Routers -----------------

# Include the routers into the main application.
# The endpoints defined in these routers will be accessible under their specified prefixes.

app.include_router(elevenlabs_router.router)
app.include_router(payu_payments_router.router)
app.include_router(bookeo_router.router)
app.include_router(event_router.router)
app.include_router(lead_router.router)
app.include_router(dashboard_router.router)
app.include_router(compute_router2.router)
app.include_router(analysis_combined_kpi_router.router)
app.include_router(booking_router.router)
app.include_router(branch_router.router)
app.include_router(call_analysis_router.router)
app.include_router(call_router.router)
app.include_router(customer_router.router)
app.include_router(employee_router.router)
app.include_router(payment_router.router)
app.include_router(theme_router.router)

# app.include_router(consumption_router.router)
# app.include_router(followup_router.router)
# app.include_router(linktracker_router.router)
# app.include_router(scripts_router.router)
# app.include_router(slot_router.router)
# Add other routers here as you create them...
# e.g., app.include_router(customer_router.router)

# ----------------- Root Endpoint -----------------

@app.get("/", tags=["Root"])
async def read_root():
    """
    A root endpoint to confirm the API is running.
    """
    return {"message": "Welcome! The Call & Booking Analytics API is running."}
