from fastapi import HTTPException, status

class PipelineExecutionException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Pipeline Execution Failed: {detail}")

class ModelNotFoundException(HTTPException):
    def __init__(self, model_name: str, entity_id: str):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=f"{model_name} with ID '{entity_id}' not found.")

class VendorIntegrationException(HTTPException):
    def __init__(self, vendor: str, detail: str):
        super().__init__(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Vendor Integration ({vendor}) Error: {detail}")
