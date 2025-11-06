# routers/user_router.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from backend.models.user_model import UserCreate, UserUpdate, UserOut,ValidationRequest, ValidationResponse
from backend.services.user_service import UserService, DatabaseError
from backend.config.supabase_client import supabase

router = APIRouter(prefix="/users", tags=["users"])

def get_user_service() -> UserService:
    return UserService(client=supabase, table_name="user")


@router.get("", response_model=List[UserOut], status_code=status.HTTP_200_OK)
def list_users(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    svc: UserService = Depends(get_user_service),
) -> List[UserOut]:
    rows = svc.list_users(limit=limit, offset=offset)
    return [UserOut(**row) for row in rows]

@router.get("/by-email", response_model=UserOut, status_code=status.HTTP_200_OK)
def get_user_by_email(
    email: str,
    svc: UserService = Depends(get_user_service),
) -> UserOut:
    row = svc.get_user_by_email(email)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    return UserOut(**row)

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload:UserCreate, svc: UserService = Depends(get_user_service)) -> UserOut:
    try:
        return svc.create_user_with_role(payload)
    except DatabaseError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service unavailable")

@router.put("/{user_id}", response_model=UserOut, status_code=status.HTTP_200_OK)
def update_user(user_id: str, payload: UserUpdate, svc: UserService = Depends(get_user_service)) -> UserOut:
    try:
        return svc.update_user(user_id, payload)
    except DatabaseError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service unavailable")

@router.delete("/{user_id}")
def delete_user(user_id: str, svc: UserService = Depends(get_user_service)):
    try:
        success, message = svc.delete_user(user_id)

        if not success:
            # Return 400 if user cannot be deleted (bad request)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

        # If success, return 204 (no content)
        return {"detail": message}

    except HTTPException:
        # Let already-raised HTTPExceptions pass through
        raise

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
        )

@router.post("/validate", response_model=ValidationResponse, status_code=status.HTTP_200_OK)
def validate_user(payload: ValidationRequest, svc: UserService = Depends(get_user_service)) -> ValidationResponse:
    return svc.validate_credentials(payload)
