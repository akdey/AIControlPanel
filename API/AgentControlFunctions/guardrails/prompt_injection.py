"""
ProtectAI & DeBERTa Prompt Injection Shield Control Function (Phase 1)
----------------------------------------------------------------------
Control ID: ctrl_prompt_injection
Engine Key: rebuff_injector

How This Control Works:
1. Intercepts prompt text from `ctx.get_input_prompt("in_prompt")` or `ctx.prompt_object["prompt"]`.
2. Evaluates the text using HuggingFace transformers classification model (`deepset/deberta-v3-base-injection`).
3. Obtains label (`INJECTION`) and confidence score.
4. Compares confidence score against `threshold` (default 0.5).
5. If prompt injection or jailbreak is detected:
   - Sets `ctx.execution_status = "blocked"` and `ctx.action_taken = "Halt"`.
   - Records "PROMPT_INJECTION_DETECTED" in `ctx.taint_flags`.
   - Routes payload to output handle `out_block`.
6. If clean, routes payload to output handle `out_pass`.
7. Enforces Fail-Closed policy: if model is offline or throws exceptions, halts pipeline execution immediately.
"""

import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

logger = logging.getLogger(__name__)

# Production HuggingFace Transformers Model Initialization
try:
    from transformers import pipeline
    injection_classifier = pipeline(
        "text-classification",
        model="deepset/deberta-v3-base-injection"
    )
    HAS_TRANSFORMERS_INJECTION = True
except Exception as e:
    HAS_TRANSFORMERS_INJECTION = False
    logger.error(f"Critical: Prompt Injection classifier model failed to load ({e})")

@register_control(["rebuff_injector", "ctrl_prompt_injection", "check_injection"])
def execute_prompt_injection(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    DeBERTa Prompt Injection & Jailbreak Shield using deepset/deberta-v3-base-injection.
    Inputs:
      - in_prompt: Input prompt text or prompt object
    Config Properties:
      - strict_mode: Boolean sensitivity flag
      - threshold: Float confidence score (default 0.5)
    Outputs:
      - out_pass: Clean prompt payload
      - out_block: Injection flagged payload
    """
    start_time = time.time()
    text = ctx.get_input_prompt("in_prompt") or ctx.prompt_object.get("prompt", "")
    threshold = float(node_config.get("threshold", 0.5))

    if not HAS_TRANSFORMERS_INJECTION:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Prompt Injection Shield"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: DeBERTa Prompt Injection Model not loaded. Halted under Fail-Closed policy."
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
        ctx.set_output("out_block", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_block"
        return ctx

    try:
        results = injection_classifier(text[:512])
        label = str(results[0].get("label", "")).upper()
        score = float(results[0].get("score", 0.0))
        detected = (label in ["INJECTION", "LABEL_1"] and score >= threshold)
    except Exception as e:
        logger.error(f"Prompt injection classification exception ({e})")
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Prompt Injection Shield"
        ctx.trigger_reason = f"Security Evaluation Error ({str(e)}). Halted under Fail-Closed policy."
        ctx.set_output("out_block", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_block"
        return ctx

    status = "passed"
    if detected:
        status = "blocked"
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Prompt Injection Shield"
        ctx.trigger_reason = f"Prompt injection / jailbreak attack detected by DeBERTa model (score: {score:.2f})."
        ctx.set_output("out_block", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_block"
        if "PROMPT_INJECTION_DETECTED" not in ctx.taint_flags:
            ctx.taint_flags.append("PROMPT_INJECTION_DETECTED")
    else:
        ctx.set_output("out_pass", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_pass"

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Prompt Injection Shield"),
        node_type="guardrail",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload={"prompt": text[:100]},
        output_payload={"injection_detected": detected, "injection_score": score},
        error_details=ctx.trigger_reason if status == "blocked" else None
    )

    return ctx
