# routers/employee_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.employee_model import EmployeeCreate, EmployeeUpdate, EmployeeOut,ValidationRequest, ValidationResponse
from backend.services.employee_service import EmployeeService, DatabaseError
from backend.config.supabase_client import supabase

router = APIRouter(prefix="/employees", tags=["employees"])

def get_employee_service() -> EmployeeService:
    return EmployeeService(client=supabase, table_name="employee")

@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, svc: EmployeeService = Depends(get_employee_service)) -> EmployeeOut:
    try:
        return svc.create_employee_with_role(payload)
    except DatabaseError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service unavailable")

@router.put("/{user_id}", response_model=EmployeeOut, status_code=status.HTTP_200_OK)
def update_employee(user_id: str, payload: EmployeeUpdate, svc: EmployeeService = Depends(get_employee_service)) -> EmployeeOut:
    try:
        return svc.update_employee(user_id, payload)
    except DatabaseError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service unavailable")

# @router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_employee(user_id: str, svc: EmployeeService = Depends(get_employee_service)) -> None:
#     try:
#         svc.delete_employee(user_id, cascade_auth=True)
#         return
#     except Exception as e:
#         print(e)
#         raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service unavailable")

@router.post("/validate", response_model=ValidationResponse, status_code=status.HTTP_200_OK)
def validate_employee(payload: ValidationRequest, svc: EmployeeService = Depends(get_employee_service)) -> ValidationResponse:
    return svc.validate_credentials(payload)
