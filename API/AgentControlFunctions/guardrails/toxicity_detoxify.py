"""
Detoxify PyTorch Multi-Axis Toxicity Moderation Control Function (Phase 1)
--------------------------------------------------------------------------
Control ID: ctrl_toxicity_checker
Engine Key: detoxify

How This Control Works:
1. Intercepts prompt text from `ctx.get_input_prompt("in_prompt")` or `ctx.prompt_object["prompt"]`.
2. Evaluates 6 toxicity axes via Detoxify PyTorch model:
   - General Toxicity
   - Severe Toxicity
   - Threat / Violence
   - Insult / Profanity
   - Obscenity
   - Identity Attack
3. Compares scores against configured thresholds (`threshold`, `severe_toxicity`, `threat`, `insult`).
4. If toxic content is detected:
   - Sets `ctx.execution_status = "blocked"` and `ctx.action_taken = "Halt"`.
   - Records "TOXICITY_FLAG" in `ctx.taint_flags`.
   - Routes payload to output handle `out_toxic`.
5. If clean, routes payload to output handle `out_pass`.
6. Enforces Fail-Closed policy: halts execution if model is offline or throws exceptions.
"""

import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

logger = logging.getLogger(__name__)

try:
    from detoxify import Detoxify
    detoxify_model = Detoxify("original")
    HAS_DETOXIFY = True
except Exception as e:
    HAS_DETOXIFY = False
    logger.error(f"Critical: Detoxify PyTorch model failed to load ({e})")

@register_control(["detoxify", "detoxify_classifier", "ctrl_toxicity_checker"])
def execute_toxicity_detoxify(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Detoxify PyTorch Content Moderation Classifier.
    Inputs:
      - in_prompt: Input prompt text or object
    Outputs:
      - out_pass: Safe Context
      - out_toxic: Toxic Flag Payload
    """
    start_time = time.time()
    text = ctx.get_input_prompt("in_prompt") or ctx.prompt_object.get("prompt", "")
    
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
        ctx.set_output("out_toxic", ctx.prompt_object)
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
        ctx.set_output("out_toxic", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_toxic"
        return ctx

    ctx.metadata["toxicity_score"] = toxicity_score
    ctx.metadata["toxicity_scores"] = scores

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
        ctx.set_output("out_toxic", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_toxic"
        if "TOXICITY_FLAG" not in ctx.taint_flags:
            ctx.taint_flags.append("TOXICITY_FLAG")
    else:
        status = "passed"
        ctx.set_output("out_pass", ctx.prompt_object)
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
