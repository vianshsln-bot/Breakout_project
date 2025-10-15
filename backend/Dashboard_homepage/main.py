from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dashboard_routes import router as dashboard_router

app = FastAPI(
    title="Escape Room Dashboard",
    version="1.0",
    description="Backend API for real-time booking and call analytics dashboard."
)
# -------------------
# CORS setup
# -------------------
origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # which domains can access your API
    allow_credentials=True,
    allow_methods=["*"],        # GET, POST, PUT, DELETE
    allow_headers=["*"],        # allow custom headers
)

# Include Dashboard Router
app.include_router(dashboard_router)

# Root route
@app.get("/")
def home():
    return {"message": "Dashboard API is running 🚀"}
