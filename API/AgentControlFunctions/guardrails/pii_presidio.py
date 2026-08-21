"""
Microsoft Presidio PII Masking Control Function (Phase 1)
---------------------------------------------------------
Control ID: ctrl_pii_masking
Engine Key: presidio_analyzer

How This Control Works:
1. Intercepts prompt text from `ctx.get_input_prompt("in_text")` or `ctx.prompt_object["prompt"]`.
2. Runs Microsoft Presidio `AnalyzerEngine` to detect PII entities (Emails, Phone Numbers, SSNs, Credit Cards, IP addresses).
3. If PII entities are found, passes analyzer results to `AnonymizerEngine` to replace PII with anonymized tokens (e.g. `[EMAIL_ADDRESS]`).
4. If node_config `action` is "BLOCK", halts pipeline execution (`ctx.execution_status = "blocked"`).
5. Updates `ctx.sanitized_prompt_object["prompt"]` and emits payload on output handle `out_sanitized`.
6. Enforces Fail-Closed policy: if Presidio engine is unavailable or throws an exception, halts execution immediately to avoid data leakage.
"""

import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

logger = logging.getLogger(__name__)

try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_anonymizer import AnonymizerEngine
    presidio_analyzer_engine = AnalyzerEngine()
    presidio_anonymizer_engine = AnonymizerEngine()
    HAS_PRESIDIO = True
except Exception as e:
    HAS_PRESIDIO = False
    logger.error(f"Critical: Microsoft Presidio PII Engine failed to load ({e})")

@register_control(["presidio_analyzer", "ctrl_pii_masking"])
def execute_pii_presidio(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Microsoft Presidio PII Masking & Redaction Engine.
    Inputs:
      - in_text: Input prompt or payload
    Outputs:
      - out_sanitized: Sanitized payload with PII redacted
    """
    start_time = time.time()
    input_text = ctx.get_input_prompt("in_text") or ctx.prompt_object.get("prompt", "")

    if not HAS_PRESIDIO:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Microsoft Presidio PII Masking"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: Presidio PII Analyzer not loaded. Halted under Fail-Closed policy."
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
        return ctx

    try:
        results = presidio_analyzer_engine.analyze(text=input_text, language="en")
        redactions_found = [res.entity_type for res in results]

        if results:
            anonymized_result = presidio_anonymizer_engine.anonymize(text=input_text, analyzer_results=results)
            sanitized_text = anonymized_result.text
        else:
            sanitized_text = input_text
    except Exception as e:
        logger.error(f"Presidio PII analysis exception ({e})")
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Microsoft Presidio PII Masking"
        ctx.trigger_reason = f"PII Security Evaluation Error ({str(e)}). Halted under Fail-Closed policy."
        return ctx

    ctx.sanitized_prompt_object = dict(ctx.prompt_object)
    ctx.sanitized_prompt_object["prompt"] = sanitized_text
    ctx.prompt_object["prompt"] = sanitized_text
    ctx.set_output("out_sanitized", ctx.sanitized_prompt_object)

    mutated_fields = []
    if redactions_found:
        if "PII_DETECTED" not in ctx.taint_flags:
            ctx.taint_flags.append("PII_DETECTED")
        ctx.redaction_metadata["pii_redacted_count"] = len(redactions_found)
        ctx.redaction_metadata["types"] = list(set(redactions_found))

        configured_action = node_config.get("action", "REDACT").upper()
        if configured_action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"PII Masking Guardrail detected sensitive entities: {list(set(redactions_found))}"
            status = "blocked"
        else:
            ctx.action_taken = "Redact"
            mutated_fields.append("prompt")
            status = "mutated"
    else:
        status = "passed"

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Microsoft Presidio PII Masking"),
        node_type="guardrail",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload={"prompt": input_text},
        output_payload={"sanitized_prompt": sanitized_text, "redactions": len(redactions_found)},
        mutated_fields=mutated_fields
    )

    return ctx
