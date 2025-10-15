from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import theme_service
from backend.models.theme_model import Theme, ThemeCreate, ThemeUpdate

router = APIRouter(
    prefix="/themes",
    tags=["Themes"]
)

@router.post("/", response_model=Theme, status_code=status.HTTP_201_CREATED)
def create_new_theme(theme_data: ThemeCreate):
    """Create a new themed package."""
    try:
        return theme_service.create_theme(theme_data)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.get("/", response_model=List[Theme])
def read_all_themes(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all themed packages."""
    try:
        return theme_service.get_all_themes(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{theme_id}", response_model=Theme)
def read_theme_by_id(theme_id: str):
    """Retrieve a specific theme by its ID."""
    theme = theme_service.get_theme_by_id(theme_id)
    if not theme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
    return theme

@router.patch("/{theme_id}", response_model=Theme)
def update_existing_theme(theme_id: str, theme_data: ThemeUpdate):
    """Update an existing theme's details."""
    try:
        updated_theme = theme_service.update_theme(theme_id, theme_data)
        if not updated_theme:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
        return updated_theme
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=e.message)

@router.delete("/{theme_id}", response_model=Theme)
def delete_existing_theme(theme_id: str):
    """Delete a theme."""
    deleted_theme = theme_service.delete_theme(theme_id)
    if not deleted_theme:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Theme not found")
    return deleted_theme