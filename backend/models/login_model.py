from pydantic import BaseModel, EmailStr

class ValidationRequest(BaseModel):
    email: EmailStr
    password: str


class ValidationResponse(BaseModel):
    exists: bool
    reason: str
