import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control
from detoxify import Detoxify

logger = logging.getLogger(__name__)

# Initialize Production Detoxify PyTorch Model
try:
    detoxify_model = Detoxify("original")
    HAS_DETOXIFY = True
except Exception as e:
    HAS_DETOXIFY = False
    logger.error(f"Critical: Detoxify PyTorch model failed to load ({e})")

@register_control(["detoxify", "detoxify_classifier"])
def execute_toxicity_detoxify(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Production Fail-Closed Detoxify Content Moderation Classifier.
    Evaluates multi-dimensional toxicity scores:
      - general toxicity
      - severe toxicity
      - threat / violence
      - insult / profanity
      - obscenity & identity attack

    Output Handles in sync with ctrl_toxicity_checker.json:
      - out_pass: Safe Context (sanitized_prompt_object)
      - out_toxic: Toxicity Flag (taint_flag)
    """
    start_time = time.time()
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", ""))
    
    # Read configured thresholds
    threshold = float(node_config.get("threshold", 0.75))
    sub_thresholds = node_config.get("subcategories", {}) or {}
    severe_threshold = float(sub_thresholds.get("severe_toxicity", node_config.get("severe_toxicity", 0.5)))
    threat_threshold = float(sub_thresholds.get("threat", node_config.get("threat", 0.4)))
    insult_threshold = float(sub_thresholds.get("insult", node_config.get("insult", 0.8)))

    if not HAS_DETOXIFY:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Toxicity Moderation"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: Detoxify PyTorch Model not loaded. Halted under Fail-Closed policy."
        ctx.metadata["next_handle_id"] = "out_toxic"
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
        return ctx

    try:
        raw_results = detoxify_model.predict(text)
        scores = {k: float(v) for k, v in raw_results.items()}
        toxicity_score = scores.get("toxicity", 0.0)
        severe_score = scores.get("severe_toxicity", 0.0)
        threat_score = scores.get("threat", 0.0)
        insult_score = scores.get("insult", 0.0)
    except Exception as e:
        logger.error(f"Detoxify evaluation exception ({e})")
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Toxicity Moderation"
        ctx.trigger_reason = f"Toxicity Security Evaluation Error ({str(e)}). Halted under Fail-Closed policy."
        ctx.metadata["next_handle_id"] = "out_toxic"
        return ctx

    # Store full scores in metadata
    ctx.metadata["toxicity_score"] = toxicity_score
    ctx.metadata["toxicity_scores"] = scores

    # Determine if any general or sub-category threshold is breached
    is_toxic = False
    violations = []

    if toxicity_score > threshold:
        is_toxic = True
        violations.append(f"General Toxicity ({toxicity_score:.2f} > {threshold:.2f})")

    if severe_score > severe_threshold:
        is_toxic = True
        violations.append(f"Severe Toxicity ({severe_score:.2f} > {severe_threshold:.2f})")

    if threat_score > threat_threshold:
        is_toxic = True
        violations.append(f"Threat/Violence ({threat_score:.2f} > {threat_threshold:.2f})")

    if insult_score > insult_threshold:
        is_toxic = True
        violations.append(f"Insult/Profanity ({insult_score:.2f} > {insult_threshold:.2f})")

    if is_toxic:
        status = "blocked"
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Toxicity Moderation"
        ctx.trigger_reason = f"Toxicity thresholds exceeded: {', '.join(violations)}."
        ctx.metadata["next_handle_id"] = "out_toxic"
        if "TOXICITY_FLAG" not in ctx.taint_flags:
            ctx.taint_flags.append("TOXICITY_FLAG")
    else:
        status = "passed"
        ctx.metadata["next_handle_id"] = "out_pass"

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Toxicity Moderation"),
        node_type="guardrail",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload={"prompt": text[:100]},
        output_payload={"evaluatedScores": scores, "violations": violations},
        error_details=ctx.trigger_reason if status == "blocked" else None
    )

    return ctx
