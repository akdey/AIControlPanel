import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class PipelineContext(BaseModel):
    """
    Mutable context passed through graph execution nodes.
    """
    pipeline_id: str
    current_node_id: str = "start"
    prompt_object: Dict[str, Any] = Field(default_factory=dict)
    tool_manifest: List[Dict[str, Any]] = Field(default_factory=list)
    sanitized_prompt_object: Dict[str, Any] = Field(default_factory=dict)
    redaction_metadata: Dict[str, Any] = Field(default_factory=dict)
    taint_flags: List[str] = Field(default_factory=list)
    spans: List[Dict[str, Any]] = Field(default_factory=list)
    
    execution_status: str = "passed"  # passed, blocked, halted, error
    action_taken: Optional[str] = None  # Halt, Redact, Route Fallback, Alert, Allow
    intercepted_control: Optional[str] = None
    trigger_reason: Optional[str] = None
    
    next_node_id: Optional[str] = None
    last_evaluated_output_port: Optional[str] = None
    routing_decision: Optional[str] = None
    final_output: Optional[Any] = None
    
    def add_span(
        self,
        node_id: str,
        node_name: str,
        node_type: str,
        start_time: float,
        end_time: float,
        status: str,
        input_payload: Any,
        output_payload: Any,
        mutated_fields: Optional[List[str]] = None,
        token_cost: float = 0.0,
        error_details: Optional[str] = None,
    ):
        span = {
            "id": f"sp_{int(time.time() * 1000)}_{len(self.spans) + 1}",
            "traceId": f"tr_{self.pipeline_id[:8]}",
            "nodeId": node_id,
            "nodeName": node_name,
            "nodeType": node_type,
            "startTime": start_time,
            "endTime": end_time,
            "durationMs": round((end_time - start_time) * 1000, 2),
            "status": status,
            "inputPayload": input_payload,
            "outputPayload": output_payload,
            "mutatedFields": mutated_fields or [],
            "taintFlags": list(self.taint_flags),
            "tokenCost": token_cost,
            "errorDetails": error_details,
        }
        self.spans.append(span)

    def to_execution_response(self) -> Dict[str, Any]:
        return {
            "pipeline_id": self.pipeline_id,
            "status": self.execution_status,
            "action_taken": self.action_taken or ("Redact" if "PII_DETECTED" in self.taint_flags else "Allow"),
            "intercepted_control": self.intercepted_control,
            "trigger_reason": self.trigger_reason,
            "sanitized_prompt_object": self.sanitized_prompt_object,
            "final_output": self.final_output,
            "taint_flags": self.taint_flags,
            "spans": self.spans,
            "total_nodes_executed": len(self.spans),
        }
