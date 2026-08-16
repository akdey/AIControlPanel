import time
from typing import Dict, Any
from app.AgentControlFunctions.context import PipelineContext
from app.AgentControlFunctions.registry import register_control

INJECTION_PATTERNS = ["ignore previous instructions", "system override", "you are now DAN", "drop database"]

@register_control(["prompt_injection", "ctrl_prompt_injection", "prompt_injection_shield"])
def execute_prompt_injection(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Evaluates prompt injection / system prompt override attacks.
    """
    start_time = time.time()
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", "")).lower()
    
    detected = any(pattern in text for pattern in INJECTION_PATTERNS)
    
    status = "passed"
    if detected:
        status = "blocked"
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Prompt Injection Guard"
        ctx.trigger_reason = "Prompt injection attempt detected in input payload."
        if "PROMPT_INJECTION_DETECTED" not in ctx.taint_flags:
            ctx.taint_flags.append("PROMPT_INJECTION_DETECTED")
            
    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Prompt Injection Guard"),
        node_type="guardrail",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload={"prompt": text[:100]},
        output_payload={"injection_detected": detected},
        error_details=ctx.trigger_reason if status == "blocked" else None
    )
    
    return ctx
