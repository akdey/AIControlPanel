from typing import Optional
from fastapi import APIRouter, Query
from app.adaptive_layer.observability.langfuse_adapter import LangfuseAdapter
from app.adaptive_layer.observability.schemas import UnifiedMetric

router = APIRouter(prefix="/finops", tags=["FinOps & Cost Management"])
observability_adapter = LangfuseAdapter()

@router.get("/metrics", response_model=UnifiedMetric)
async def get_finops_metrics(project_id: Optional[str] = Query(None, alias="projectId")):
    """
    Unified FinOps Metrics Endpoint.
    Uses Adaptive Layer (Langfuse Façade) to return UnifiedMetric schema.
    """
    metrics = await observability_adapter.fetch_metrics(project_id=project_id)
    return metrics
