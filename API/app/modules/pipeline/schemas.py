from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class InvokePayload(BaseModel):
    promptObj: Optional[Dict[str, Any]] = None
    prompt: Optional[str] = None
    tool_manifest: List[Dict[str, Any]] = Field(default_factory=list)
    agentId: Optional[str] = None

class InvokeResponse(BaseModel):
    pipeline_id: str
    status: str  # passed, blocked, halted, error
    action_taken: str  # Allow, Halt, Redact, Route Fallback, Alert
    intercepted_control: Optional[str] = None
    trigger_reason: Optional[str] = None
    sanitized_prompt_object: Dict[str, Any] = Field(default_factory=dict)
    final_output: Optional[Any] = None
    taint_flags: List[str] = Field(default_factory=list)
    spans: List[Dict[str, Any]] = Field(default_factory=list)
    total_nodes_executed: int = 0
