import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control
from detoxify import Detoxify

logger = logging.getLogger(__name__)

# Initialize Production Detoxify Model
detoxify_model = Detoxify("original")

@register_control(["detoxify_classifier"])
def execute_toxicity_detoxify(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Production Detoxify Content Moderation Classifier.
    Evaluates toxicity score using Detoxify RoBERTa model against configured threshold.
    """
    start_time = time.time()
    threshold = float(node_config.get("threshold", 0.75))
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", ""))

    results = detoxify_model.predict(text)
    toxicity_score = float(results.get("toxicity", 0.0))

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
