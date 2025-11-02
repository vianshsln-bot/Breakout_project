from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import call_service
from backend.models.call_model import Call, CallCreate, CallUpdate

router = APIRouter(
    prefix="/calls",
    tags=["Calls"]
)

# @router.post("/", response_model=Call, status_code=status.HTTP_201_CREATED)
# def create_new_call(call_data: CallCreate):
#     """Create a new call record."""
#     try:
#         return call_service.create_call(call_data)
#     except APIError as e:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Call])
def read_all_calls(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all call records."""
    try:
        return call_service.get_all_calls(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

# @router.get("/conversation/{conv_id}", response_model=Call)
# def read_call_by_conv_id(conv_id: str):
#     """Retrieve a specific call by its conversation ID."""
#     call = call_service.get_call_by_conv_id(conv_id)
#     if not call:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
#     return call
    
# @router.get("/customer/{customer_id}", response_model=List[Call])
# def read_calls_for_customer(customer_id: int):
#     """Retrieve all calls for a specific customer."""
#     try:
#         return call_service.get_calls_by_customer_id(customer_id)
#     except APIError as e:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

# @router.patch("/conversation/{conv_id}", response_model=Call)
# def update_existing_call(conv_id: str, call_data: CallUpdate):
#     """Update an existing call record."""
#     try:
#         updated_call = call_service.update_call(conv_id, call_data)
#         if not updated_call:
#             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
#         return updated_call
#     except APIError as e:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

# @router.delete("/conversation/{conv_id}", response_model=Call)
# def delete_existing_call(conv_id: str):
#     """Delete a call record."""
#     deleted_call = call_service.delete_call(conv_id)
#     if not deleted_call:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
#     return deleted_call