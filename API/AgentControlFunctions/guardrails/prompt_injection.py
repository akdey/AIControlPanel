import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

logger = logging.getLogger(__name__)

# Initialize Protect AI Open-Source DeBERTa Prompt Injection Classifier Model
try:
    from transformers import pipeline
    injection_classifier = pipeline(
        "text-classification",
        model="protectai/deberta-v3-small-prompt-injection-v2",
        subfolder=""
    )
    HAS_TRANSFORMERS_INJECTION = True
except Exception as e:
    HAS_TRANSFORMERS_INJECTION = False
    logger.debug(f"Transformers Prompt Injection model lazy-loaded or offline ({e})")

@register_control(["rebuff_injector"])
def execute_prompt_injection(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Production Protect AI & Rebuff Prompt Injection Detector.
    Uses DeBERTa text-classification model to score prompt injection & jailbreak probabilities.
    """
    start_time = time.time()
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", ""))
    threshold = float(node_config.get("threshold", 0.5))

    injection_score = 0.0
    detected = False

    if HAS_TRANSFORMERS_INJECTION and text.strip():
        try:
            results = injection_classifier(text[:512])
            if results:
                label = results[0].get("label", "").upper()
                score = float(results[0].get("score", 0.0))
                if label in ["INJECTION", "LABEL_1"] and score >= threshold:
                    detected = True
                    injection_score = score
        except Exception as e:
            logger.warning(f"Prompt injection classification failed ({e})")

    status = "passed"
    if detected:
        status = "blocked"
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Rebuff Prompt Injection Guard"
        ctx.trigger_reason = f"Prompt injection / jailbreak detected with probability score ({injection_score:.2f})."
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
        output_payload={"injection_detected": detected, "injection_score": injection_score},
        error_details=ctx.trigger_reason if status == "blocked" else None
    )

    return ctx
