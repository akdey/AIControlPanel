"""
HIPAA PHI Protection & Compliance Scrubber Control Function (Phase 1)
----------------------------------------------------------------------
Control ID: ctrl_phi_redactor
Engine Key: phi_redactor

How This Control Works:
1. Intercepts prompt text from `ctx.get_input_prompt("in_payload")` or `ctx.prompt_object["prompt"]`.
2. Uses Microsoft Presidio `AnalyzerEngine` configured with HIPAA medical recognizers (Medical Licenses, Healthcare Numbers, Patient IDs, Dates).
3. Replaces detected medical identifiers with anonymized tokens (e.g. `[HEALTHCARE_NUMBER]`).
4. If node_config `action` is "BLOCK", halts pipeline execution (`ctx.execution_status = "blocked"`), routing to output handle `out_block`.
5. Updates `ctx.sanitized_prompt_object["prompt"]` and emits payload on output handle `out_scrubbed`.
"""

import logging
from typing import Dict, Any

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_anonymizer import AnonymizerEngine
    phi_analyzer_engine = AnalyzerEngine()
    phi_anonymizer_engine = AnonymizerEngine()
    HAS_PRESIDIO_PHI = True
except Exception as e:
    HAS_PRESIDIO_PHI = False
    logger.error(f"Critical: Presidio PHI Engine failed to load ({e})")

HIPAA_PHI_ENTITIES = [
    "MEDICAL_LICENSE",
    "HEALTHCARE_NUMBER",
    "US_DRIVER_LICENSE",
    "US_PASSPORT",
    "US_BANK_NUMBER",
    "PERSON",
    "PHONE_NUMBER",
    "EMAIL_ADDRESS",
    "DATE_TIME",
    "LOCATION",
    "IP_ADDRESS"
]

@register_control(["phi_redactor", "ctrl_phi_redactor", "scrub_phi"])
def scrub_phi(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    HIPAA PHI Compliance Scrubber.
    Inputs:
      - in_payload: Input prompt object
    Config Properties:
      - action: 'REDACT' or 'BLOCK'
    Outputs:
      - out_scrubbed: Scrubbed payload
      - out_block: Blocked payload
    """
    prompt = ctx.get_input_prompt("in_payload") or ctx.prompt_object.get("prompt", "")

    if not HAS_PRESIDIO_PHI:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "HIPAA PHI Scrubber"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: Presidio PHI Analyzer not loaded. Halted under Fail-Closed policy."
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
        ctx.set_output("out_block", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_block"
        return ctx

    try:
        results = phi_analyzer_engine.analyze(
            text=prompt,
            entities=HIPAA_PHI_ENTITIES,
            language="en"
        )
        phi_entities_found = [res.entity_type for res in results]

        if results:
            anonymized_result = phi_anonymizer_engine.anonymize(
                text=prompt,
                analyzer_results=results
            )
            scrubbed = anonymized_result.text
        else:
            scrubbed = prompt
    except Exception as e:
        logger.error(f"PHI Scrubber evaluation exception ({e})")
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "HIPAA PHI Scrubber"
        ctx.trigger_reason = f"PHI Security Evaluation Error ({str(e)}). Halted under Fail-Closed policy."
        ctx.set_output("out_block", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_block"
        return ctx

    phi_count = len(results)

    if phi_count > 0:
        ctx.prompt_object["prompt"] = scrubbed
        ctx.sanitized_prompt_object["prompt"] = scrubbed
        ctx.metadata["phi_scrubbed_count"] = phi_count
        ctx.metadata["phi_entity_types"] = list(set(phi_entities_found))
        ctx.redaction_metadata["phi_entities"] = phi_count
        if "PHI_DETECTED" not in ctx.taint_flags:
            ctx.taint_flags.append("PHI_DETECTED")

        configured_action = node_config.get("action", "REDACT").upper()
        if configured_action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"HIPAA PHI Guardrail detected sensitive healthcare entities: {list(set(phi_entities_found))}"
            ctx.set_output("out_block", ctx.prompt_object)
            ctx.metadata["next_handle_id"] = "out_block"
        else:
            ctx.action_taken = "Redact"
            ctx.execution_status = "mutated"
            ctx.set_output("out_scrubbed", ctx.sanitized_prompt_object)
            ctx.metadata["next_handle_id"] = "out_scrubbed"
    else:
        ctx.set_output("out_scrubbed", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_scrubbed"

    return ctx
