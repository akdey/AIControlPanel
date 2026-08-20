import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control
from detoxify import Detoxify

logger = logging.getLogger(__name__)

# Initialize Production Detoxify Model
try:
    detoxify_model = Detoxify("original")
    HAS_DETOXIFY = True
except Exception as e:
    HAS_DETOXIFY = False
    logger.error(f"Critical: Detoxify PyTorch model failed to load ({e})")

@register_control(["detoxify_classifier"])
def execute_toxicity_detoxify(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Production Fail-Closed Detoxify Content Moderation Classifier.
    Strict Fail-Closed Policy: If Detoxify model is offline or fails, halts execution immediately
    to prevent exposing toxic prompts to downstream LLMs.
    """
    start_time = time.time()
    threshold = float(node_config.get("threshold", 0.75))
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", ""))

    if not HAS_DETOXIFY:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Detoxify Classifier"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: Detoxify PyTorch Model not loaded. Halted under Fail-Closed policy."
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
        return ctx

    try:
        results = detoxify_model.predict(text)
        toxicity_score = float(results.get("toxicity", 0.0))
    except Exception as e:
        logger.error(f"Detoxify evaluation exception ({e})")
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Detoxify Classifier"
        ctx.trigger_reason = f"Toxicity Security Evaluation Error ({str(e)}). Halted under Fail-Closed policy."
        return ctx

    ctx.metadata["toxicity_score"] = toxicity_score

    status = "passed"
    if toxicity_score > threshold:
        status = "blocked"
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Detoxify Classifier"
        ctx.trigger_reason = f"Toxicity score ({toxicity_score:.2f}) exceeded threshold ({threshold:.2f})."
        if "TOXICITY_FLAG" not in ctx.taint_flags:
            ctx.taint_flags.append("TOXICITY_FLAG")

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Detoxify Classifier"),
        node_type="guardrail",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload={"prompt": text},
        output_payload={"evaluatedToxicity": toxicity_score, "threshold": threshold},
        error_details=ctx.trigger_reason if status == "blocked" else None
    )

    return ctx
