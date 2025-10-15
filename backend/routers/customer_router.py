from fastapi import APIRouter, HTTPException, status
from typing import List
from backend.services import customer_service
from backend.models.customer_model import Customer, CustomerCreate, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("/", response_model=Customer, status_code=status.HTTP_201_CREATED)
def create_new_customer(customer: CustomerCreate):
    try:
        new_customer = customer_service.create_customer(customer)
        return new_customer
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[Customer])
def read_all_customers(skip: int = 0, limit: int = 100):
    customers = customer_service.get_all_customers(skip=skip, limit=limit)
    return customers

@router.get("/{customer_id}", response_model=Customer)
def read_customer_by_id(customer_id: str):
    customer = customer_service.get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer

@router.put("/{customer_id}", response_model=Customer)
def update_customer(customer_id: str, customer_update: CustomerUpdate):
    updated_customer = customer_service.update_customer(customer_id, customer_update)
    if not updated_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return updated_customer

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: str):
    success = customer_service.delete_customer(customer_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
