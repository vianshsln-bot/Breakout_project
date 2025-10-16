from fastapi import APIRouter
from backend.models.login_models import ValidationRequest, ValidationResponse
from backend.services.login_service import validate_user_credentials, DatabaseError

import logging
from fastapi import APIRouter, HTTPException, status, Depends

router = APIRouter(prefix="/validate", tags=["validation"])
logger = logging.getLogger("validation_router")


# optional: create a dependency factory so DI is easy to change in tests
def get_validation_service() -> ValidationService:
    return ValidationService()


@router.post("/", response_model=ValidationResponse)
def validate_user(payload: ValidationRequest, svc: ValidationService = Depends(get_validation_service)):
    """
    Validate email/password pair and return { exists, reason, is_admin }.
    - returns 200 for both valid and invalid credentials (exists True/False).
    - returns 502 if there's a DatabaseError (upstream failure).
    - returns 500 for other unexpected errors.
    """
    try:
        exists, reason, is_admin = svc.validate_credentials(payload.email, payload.password)
        return ValidationResponse(exists=exists, reason=reason, is_admin=is_admin)

    except DatabaseError as db_err:
        logger.error("DatabaseError in /validate: %s", db_err)
        # Upstream DB error -> 502 Bad Gateway
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(db_err))

    except Exception:
        logger.exception("Unhandled error in /validate")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
