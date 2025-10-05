from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import consumption_service
from backend.models.consumption_model import Consumption, ConsumptionCreate

router = APIRouter(
    prefix="/consumptions",
    tags=["Consumptions"]
)

@router.post("/", response_model=Consumption, status_code=status.HTTP_201_CREATED)
def create_new_consumption_log(consumption_data: ConsumptionCreate):
    """Create a new consumption log entry."""
    try:
        return consumption_service.create_consumption(consumption_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Consumption])
def read_all_consumption_logs(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all consumption log entries."""
    try:
        return consumption_service.get_all_consumptions(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{consumption_id}", response_model=Consumption)
def read_consumption_log_by_id(consumption_id: int):
    """Retrieve a specific consumption log by its ID."""
    consumption = consumption_service.get_consumption_by_id(consumption_id)
    if not consumption:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consumption log not found")
    return consumption

@router.get("/conversation/{conv_id}", response_model=List[Consumption])
def read_consumption_logs_by_conv_id(conv_id: str):
    """Retrieve all consumption logs for a specific conversation ID."""
    try:
        return consumption_service.get_consumptions_by_conv_id(conv_id)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)