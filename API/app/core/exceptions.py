from typing import Optional, Dict, Any
from fastapi import status

class BaseAppException(Exception):
    """
    Base Domain Exception for Control Panel API.
    Carries HTTP status code, machine-readable error_code, human-readable detail message,
    and optional extra context metadata.
    """
    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "BAD_REQUEST",
        extra: Optional[Dict[str, Any]] = None
    ):
        self.detail = detail
        self.status_code = status_code
        self.error_code = error_code
        self.extra = extra or {}
        super().__init__(detail)

class AccountLockedException(BaseAppException):
    def __init__(self, detail: str = "User account is locked due to security policy violations."):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="ACCOUNT_LOCKED"
        )

class ResourceNotFoundException(BaseAppException):
    def __init__(self, detail: str = "Requested resource not found."):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND"
        )

class UnauthorizedOperationException(BaseAppException):
    def __init__(self, detail: str = "Unauthorized operation."):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="UNAUTHORIZED_ACCESS"
        )

class PipelineExecutionException(BaseAppException):
    def __init__(self, detail: str):
        super().__init__(
            detail=f"Pipeline Execution Failed: {detail}",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="PIPELINE_EXECUTION_FAILED"
        )

class ModelNotFoundException(ResourceNotFoundException):
    def __init__(self, model_name: str, entity_id: str):
        super().__init__(detail=f"{model_name} with ID '{entity_id}' not found.")

class VendorIntegrationException(BaseAppException):
    def __init__(self, vendor: str, detail: str):
        super().__init__(
            detail=f"Vendor Integration ({vendor}) Error: {detail}",
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="VENDOR_INTEGRATION_ERROR"
        )
