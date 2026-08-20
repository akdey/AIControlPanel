import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control
from transformers import pipeline

logger = logging.getLogger(__name__)

# Initialize Protect AI DeBERTa Prompt Injection Classifier Model
try:
    injection_classifier = pipeline(
        "text-classification",
        model="protectai/deberta-v3-small-prompt-injection-v2"
    )
    HAS_TRANSFORMERS_INJECTION = True
except Exception as e:
    HAS_TRANSFORMERS_INJECTION = False
    logger.error(f"Critical: Prompt Injection classifier model failed to load ({e})")

@register_control(["rebuff_injector"])
def execute_prompt_injection(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Production Fail-Closed Protect AI & Rebuff Prompt Injection Detector.
    Strict Fail-Closed Policy: If classification model is unavailable or fails, execution halts
    to prevent exposing raw un-inspected prompts to downstream LLMs.
    """
    start_time = time.time()
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", ""))
    threshold = float(node_config.get("threshold", 0.5))

    if not HAS_TRANSFORMERS_INJECTION:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Rebuff Prompt Injection Guard"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: Prompt Injection Model not loaded. Halted under Fail-Closed policy."
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
        return ctx

    try:
        results = injection_classifier(text[:512])
        label = results[0].get("label", "").upper()
        score = float(results[0].get("score", 0.0))
        detected = (label in ["INJECTION", "LABEL_1"] and score >= threshold)
    except Exception as e:
        logger.error(f"Prompt injection classification exception ({e})")
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Rebuff Prompt Injection Guard"
        ctx.trigger_reason = f"Security Evaluation Error ({str(e)}). Halted under Fail-Closed policy."
        return ctx

    status = "passed"
    if detected:
        status = "blocked"
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Rebuff Prompt Injection Guard"
        ctx.trigger_reason = f"Prompt injection / jailbreak attack detected with confidence score ({score:.2f})."
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
        output_payload={"injection_detected": detected, "injection_score": score},
        error_details=ctx.trigger_reason if status == "blocked" else None
    )

    return ctx
