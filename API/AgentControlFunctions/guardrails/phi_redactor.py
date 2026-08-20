import logging
from typing import Dict, Any

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

logger = logging.getLogger(__name__)

# Initialize Microsoft Presidio Medical & PHI Entities Engine
try:
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

@register_control(["phi_redactor"])
def scrub_phi(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Production Fail-Closed HIPAA PHI Compliance Scrubber.
    Strict Fail-Closed Policy: If Presidio PHI Engine is offline or fails, halts execution immediately
    to prevent exposing un-sanitized healthcare data to downstream LLMs.
    """
    prompt = ctx.prompt_object.get("prompt", "")

    if not HAS_PRESIDIO_PHI:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "HIPAA PHI Scrubber"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: Presidio PHI Analyzer not loaded. Halted under Fail-Closed policy."
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
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

        configured_action = config_values.get("action", "REDACT").upper()
        if configured_action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"HIPAA PHI Guardrail detected sensitive healthcare entities: {list(set(phi_entities_found))}"
        else:
            ctx.action_taken = "Redact"
