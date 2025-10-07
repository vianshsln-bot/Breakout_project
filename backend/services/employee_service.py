from typing import List, Optional
from postgrest import APIError

from backend.config.supabase_client import supabase
from backend.models.employee_model import Employee, EmployeeCreate, EmployeeUpdate

def create_employee(employee_data: EmployeeCreate) -> Employee:
    """Creates a new employee record."""
    try:
        employee_dict = employee_data.model_dump(mode="json")
        response = supabase.table("employee").insert(employee_dict).execute()
        return Employee(**response.data[0])
    except APIError as e:
        raise e

def get_all_employees(skip: int = 0, limit: int = 100) -> List[Employee]:
    """Retrieves a list of all employees."""
    try:
        response = supabase.table("employee").select("*").range(skip, skip + limit - 1).execute()
        return [Employee(**item) for item in response.data] if response.data else []
    except APIError as e:
        raise e

def get_employee_by_id(employee_id: int) -> Optional[Employee]:
    """Retrieves a single employee by their ID."""
    try:
        response = supabase.table("employee").select("*").eq("employee_id", employee_id).single().execute()
        return Employee(**response.data) if response.data else None
    except APIError as e:
        print(f"Error fetching employee by ID {employee_id}: {e.message}")
        return None

def update_employee(employee_id: int, employee_data: EmployeeUpdate) -> Optional[Employee]:
    """Updates an existing employee's record."""
    try:
        update_dict = employee_data.model_dump(exclude_unset=True,mode="json")
        if not update_dict:
            return get_employee_by_id(employee_id)
        
        response = supabase.table("employee").update(update_dict).eq("employee_id", employee_id).execute()
        return Employee(**response.data[0]) if response.data else None
    except APIError as e:
        raise e

def delete_employee(employee_id: int) -> Optional[Employee]:
    """Deletes an employee from the database."""
    try:
        response = supabase.table("employee").delete().eq("employee_id", employee_id).execute()
        return Employee(**response.data[0]) if response.data else None
    except APIError as e:
        raise e