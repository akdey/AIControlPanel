import time
from typing import Dict, Any
from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

INJECTION_PATTERNS = [
    "ignore previous instructions",
    "system override",
    "you are now DAN",
    "drop database",
    "bypass safety filters",
    "disregard all prior guardrails"
]

@register_control(["rebuff_injector"])
def execute_prompt_injection(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Rebuff Prompt Injection Detector.
    Evaluates prompt injection / system prompt override attacks.
    """
    start_time = time.time()
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", "")).lower()

    detected_patterns = [p for p in INJECTION_PATTERNS if p in text]
    detected = bool(detected_patterns)

    status = "passed"
    if detected:
        status = "blocked"
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Rebuff Prompt Injection Guard"
        ctx.trigger_reason = f"Prompt injection attempt detected: '{detected_patterns[0]}'"
        if "PROMPT_INJECTION_DETECTED" not in ctx.taint_flags:
            ctx.taint_flags.append("PROMPT_INJECTION_DETECTED")

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Rebuff Prompt Injection Detector"),
        node_type="guardrail",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload={"prompt": text[:100]},
        output_payload={"injection_detected": detected, "patterns": detected_patterns},
        error_details=ctx.trigger_reason if status == "blocked" else None
    )

    return ctx
