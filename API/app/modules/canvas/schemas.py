from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class CanvasSavePayload(BaseModel):
    pipeline_id: Optional[str] = None
    project_id: Optional[str] = "proj_default"
    agent_id: Optional[str] = None
    name: str = "Control Pipeline DAG"
    nodes: List[Dict[str, Any]] = Field(default_factory=list)
    edges: List[Dict[str, Any]] = Field(default_factory=list)
    canvas_json: Optional[Dict[str, Any]] = None

class CanvasResponse(BaseModel):
    pipeline_id: str
    project_id: str
    agent_id: Optional[str] = None
    name: str
    canvas_json: Dict[str, Any]
    is_active: bool = True
    version: int = 1
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
