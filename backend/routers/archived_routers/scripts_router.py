from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import scripts_service
from backend.models.scripts_model import Script, ScriptCreate, ScriptUpdate

router = APIRouter(
    prefix="/scripts",
    tags=["Scripts"]
)

@router.post("/", response_model=Script, status_code=status.HTTP_201_CREATED)
def create_new_script(script_data: ScriptCreate):
    """Create a new script."""
    try:
        return scripts_service.create_script(script_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Script])
def read_all_scripts(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all scripts."""
    try:
        return scripts_service.get_all_scripts(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{script_id}", response_model=Script)
def read_script_by_id(script_id: int):
    """Retrieve a specific script by its ID."""
    script = scripts_service.get_script_by_id(script_id)
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    return script

@router.get("/branch/{branch_id}", response_model=List[Script])
def read_scripts_by_branch(branch_id: int):
    """Retrieve all scripts for a specific branch."""
    try:
        return scripts_service.get_scripts_by_branch_id(branch_id)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.patch("/{script_id}", response_model=Script)
def update_existing_script(script_id: int, script_data: ScriptUpdate):
    """Update an existing script's details."""
    try:
        updated_script = scripts_service.update_script(script_id, script_data)
        if not updated_script:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
        return updated_script
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{script_id}", response_model=Script)
def delete_existing_script(script_id: int):
    """Delete a script."""
    deleted_script = scripts_service.delete_script(script_id)
    if not deleted_script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    return deleted_script