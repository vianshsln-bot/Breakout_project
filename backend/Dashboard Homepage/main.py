from fastapi import FastAPI
from routes.dashboard_routes import router as dashboard_router

app = FastAPI(title="Escape Room Dashboard", version="1.0")

app.include_router(dashboard_router)

# Optional root route
@app.get("/")
def home():
    return {"message": "Dashboard API is running 🚀"}
