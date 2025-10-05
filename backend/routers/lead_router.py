from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import lead_service
from backend.models.lead_model import Lead, LeadCreate, LeadUpdate

from fastapi import APIRouter, HTTPException, status
from typing import List

router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)

@router.post("/", response_model= Lead, status_code=status.HTTP_201_CREATED)
def create_new_lead(lead: LeadCreate):
    """Endpoint to create a new lead."""
    try:
        new_lead_data = lead_service.create_lead(lead)
        return new_lead_data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[Lead])
def read_all_leads(skip: int = 0, limit: int = 100):
    """Endpoint to retrieve all leads."""
    leads = lead_service.get_all_leads(skip=skip, limit=limit)
    return leads

@router.get("/{lead_id}", response_model=Lead)
def read_lead_by_id(lead_id: int):
    """Endpoint to retrieve a specific lead by their ID."""
    lead = lead_service.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return lead

@router.patch("/{lead_id}", response_model=Lead)
def update_existing_lead(lead_id: int, lead_update: LeadUpdate):
    """Endpoint to update a lead's details."""
    updated_lead = lead_service.update_lead(lead_id, lead_update)
    if not updated_lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return updated_lead

@router.delete("/{lead_id}", response_model=Lead)
def delete_existing_lead(lead_id: int):
    """Endpoint to delete a lead."""
    deleted_lead = lead_service.delete_lead(lead_id)
    if not deleted_lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return deleted_lead