import time
from typing import Dict, Any
from app.AgentControlFunctions.context import PipelineContext
from app.AgentControlFunctions.registry import register_control

TOXIC_KEYWORDS = ["malicious", "exploit", "hack_database", "bypass_safety", "attack"]

@register_control(["detoxify", "toxicity_detoxify", "ctrl_toxicity_filter", "ctrl_toxicity_checker", "toxicity_checker"])
def execute_toxicity_detoxify(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Evaluates toxicity score against configured threshold.
    If toxicity score > threshold, halts execution immediately.
    """
    start_time = time.time()
    threshold = float(node_config.get("threshold", 0.75))
    
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", ""))
    
    # Calculate synthetic toxicity score
    matches = [k for k in TOXIC_KEYWORDS if k in text.lower()]
    toxicity_score = min(1.0, len(matches) * 0.4)
    
    status = "passed"
    if toxicity_score > threshold:
        status = "blocked"
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Toxicity Detoxify Filter"
        ctx.trigger_reason = f"Toxicity score ({toxicity_score:.2f}) exceeded threshold ({threshold:.2f})."
        if "TOXICITY_FLAG" not in ctx.taint_flags:
            ctx.taint_flags.append("TOXICITY_FLAG")
    
    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Toxicity Detoxify Guardrail"),
        node_type="guardrail",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload={"prompt": text},
        output_payload={"evaluatedToxicity": toxicity_score, "threshold": threshold},
        error_details=ctx.trigger_reason if status == "blocked" else None
    )
    
    return ctx
