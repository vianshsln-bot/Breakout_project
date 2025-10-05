from fastapi import APIRouter, HTTPException, status
from typing import List
from postgrest import APIError

from backend.services import branch_service
from backend.models.branch_model import Branch, BranchCreate, BranchUpdate

router = APIRouter(
    prefix="/branches",
    tags=["Branches"]
)

@router.post("/", response_model=Branch, status_code=status.HTTP_201_CREATED)
def create_new_branch(branch_data: BranchCreate):
    """Create a new branch."""
    try:
        return branch_service.create_branch(branch_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Branch])
def read_all_branches():
    """Retrieve all branches."""
    try:
        return branch_service.get_all_branches()
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{branch_id}", response_model=Branch)
def read_branch_by_id(branch_id: int):
    """Retrieve a specific branch by its ID."""
    branch = branch_service.get_branch_by_id(branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    return branch

@router.patch("/{branch_id}", response_model=Branch)
def update_existing_branch(branch_id: int, branch_data: BranchUpdate):
    """Update an existing branch's details."""
    try:
        updated_branch = branch_service.update_branch(branch_id, branch_data)
        if not updated_branch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
        return updated_branch
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{branch_id}", response_model=Branch)
def delete_existing_branch(branch_id: int):
    """Delete a branch."""
    deleted_branch = branch_service.delete_branch(branch_id)
    if not deleted_branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    return deleted_branch