from fastapi import APIRouter
from backend.models.login_models import ValidationRequest, ValidationResponse
from backend.services.login_service import validate_user_credentials

router = APIRouter(prefix="/validate", tags=["validation"])


@router.post("/", response_model=ValidationResponse)
def validate_user(payload: ValidationRequest):
    exists, reason = validate_user_credentials(payload.email, payload.password)
    return ValidationResponse(exists=exists, reason=reason)
