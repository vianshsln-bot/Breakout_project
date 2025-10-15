from fastapi import FastAPI
from dashboard_routes import router as dashboard_router

app = FastAPI(
    title="Escape Room Dashboard",
    version="1.0",
    description="Backend API for real-time booking and call analytics dashboard."
)

# Include Dashboard Router
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])

# Root route
@app.get("/")
def home():
    return {"message": "Dashboard API is running 🚀"}
