from typing import List, Optional
from fastapi import APIRouter, Query
from adaptive_layer.observability.langfuse_adapter import LangfuseAdapter
from adaptive_layer.observability.schemas import UnifiedTrace

router = APIRouter(prefix="/observability", tags=["Observability & Traces"])
observability_adapter = LangfuseAdapter()

@router.get("/traces", response_model=List[UnifiedTrace])
async def get_traces(
    project_id: Optional[str] = Query(None, alias="projectId"),
    agent_id: Optional[str] = Query(None, alias="agentId")
):
    """
    Unified Observability Traces Endpoint.
    Uses Adaptive Layer (Langfuse Façade) to return UnifiedTrace objects to UI.
    """
    traces = await observability_adapter.fetch_traces(project_id=project_id, agent_id=agent_id)
    return traces

@router.get("/sessions")
async def get_sessions():
    """
    Observability Sessions Summary.
    """
    return [
        {
            "id": "sess_1001",
            "agentId": "agt_001",
            "agentName": "Customer Support Agent",
            "startTime": "2026-08-16T12:00:00Z",
            "traceCount": 14,
            "status": "active",
            "totalTokens": 4200,
            "totalCost": 0.052
        }
    ]
