from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from modules.pipeline.schemas import InvokePayload, InvokeResponse
from modules.pipeline.engine.runner import ExecutionRunner

router = APIRouter(prefix="/pipeline", tags=["Pipeline Execution Engine"])

@router.post("/invoke/{pipeline_id}", response_model=InvokeResponse)
async def invoke_pipeline(pipeline_id: str, payload: InvokePayload, db: Session = Depends(get_db)):
    """
    Executes a saved control pipeline DAG through the Execution Engine.
    Dispatches nodes dynamically to AgentControlFunctions toolbox.
    """
    payload_dict = payload.model_dump()
    if not payload_dict.get("promptObj") and payload_dict.get("prompt"):
        payload_dict["promptObj"] = {"prompt": payload_dict["prompt"]}

    runner = ExecutionRunner(db)
    result = await runner.invoke_pipeline(pipeline_id, payload_dict)
    return result
