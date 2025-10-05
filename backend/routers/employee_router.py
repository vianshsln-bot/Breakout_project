from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from postgrest import APIError

from backend.services import employee_service
from backend.models.employee_model import Employee, EmployeeCreate, EmployeeUpdate

router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)

@router.post("/", response_model=Employee, status_code=status.HTTP_201_CREATED)
def create_new_employee(employee_data: EmployeeCreate):
    """Create a new employee."""
    try:
        return employee_service.create_employee(employee_data)
    except APIError as e:
        # Handle potential duplicate email/phone errors
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message)

@router.get("/", response_model=List[Employee])
def read_all_employees(skip: int = 0, limit: int = Query(default=100, lte=200)):
    """Retrieve all employees."""
    try:
        return employee_service.get_all_employees(skip=skip, limit=limit)
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)

@router.get("/{employee_id}", response_model=Employee)
def read_employee_by_id(employee_id: int):
    """Retrieve a specific employee by their ID."""
    employee = employee_service.get_employee_by_id(employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return employee

@router.patch("/{employee_id}", response_model=Employee)
def update_existing_employee(employee_id: int, employee_data: EmployeeUpdate):
    """Update an existing employee's details."""
    try:
        updated_employee = employee_service.update_employee(employee_id, employee_data)
        if not updated_employee:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
        return updated_employee
    except APIError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=e.message)

@router.delete("/{employee_id}", response_model=Employee)
def delete_existing_employee(employee_id: int):
    """Delete an employee."""
    deleted_employee = employee_service.delete_employee(employee_id)
    if not deleted_employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    return deleted_employee