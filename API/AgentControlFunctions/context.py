import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class PipelineContext(BaseModel):
    """
    Mutable context passed through graph execution nodes.
    Supports dynamic port-mapped input resolution and backward-compatible linear chains.
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
    
    metadata: Dict[str, Any] = Field(default_factory=dict)
    node_outputs: Dict[str, Any] = Field(default_factory=dict)
    current_inputs: Dict[str, Any] = Field(default_factory=dict)
    
    next_node_id: Optional[str] = None
    last_evaluated_output_port: Optional[str] = None
    routing_decision: Optional[str] = None
    final_output: Optional[Any] = None

    @property
    def is_blocked(self) -> bool:
        return self.execution_status in ["blocked", "halted"]

    @property
    def is_mutated(self) -> bool:
        return bool(self.redaction_metadata) or "PII_DETECTED" in self.taint_flags

    def get_input(self, port_name: str = "in_payload", default: Any = None) -> Any:
        """
        Dynamically retrieves the payload connected to a specific input port on this node.
        Falls back to global sanitized_prompt_object / prompt_object for linear pipelines.
        """
        if port_name in self.current_inputs and self.current_inputs[port_name] is not None:
            return self.current_inputs[port_name]
        
        # Fallback to sanitized prompt or original prompt
        if self.sanitized_prompt_object and "prompt" in self.sanitized_prompt_object:
            return self.sanitized_prompt_object
        if self.prompt_object and "prompt" in self.prompt_object:
            return self.prompt_object
        return default

    def get_input_prompt(self, port_name: str = "in_payload") -> str:
        """
        Extracts raw text string from the specified input port or context fallback.
        """
        val = self.get_input(port_name, "")
        if isinstance(val, dict):
            return str(val.get("prompt", val.get("text", val.get("content", ""))))
        return str(val) if val is not None else ""

    def set_output(self, port_name: str, payload: Any):
        """
        Stores an output payload on a specific output port for downstream nodes.
        """
        if self.current_node_id not in self.node_outputs:
            self.node_outputs[self.current_node_id] = {}
        if isinstance(self.node_outputs[self.current_node_id], dict):
            self.node_outputs[self.current_node_id][port_name] = payload
    
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
            "sanitized_prompt_object": self.sanitized_prompt_object or self.prompt_object,
            "final_output": self.final_output,
            "taint_flags": self.taint_flags,
            "spans": self.spans,
            "total_nodes_executed": len(self.spans),
        }
