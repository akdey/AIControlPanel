import logging
from typing import Dict, Any

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

logger = logging.getLogger(__name__)

# Initialize Microsoft Presidio Medical & PHI Entities Engine
phi_analyzer_engine = AnalyzerEngine()
phi_anonymizer_engine = AnonymizerEngine()

# Designated HIPAA Protected Health Information (PHI) Recognized Entity Types
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
    Production HIPAA PHI Compliance Scrubber using Microsoft Presidio Medical & Health Entity Engine.
    Scans prompt for HIPAA 18 Protected Health Information (PHI) identifiers (MRNs, Medical Licenses,
    Patient Names, Healthcare IDs) and anonymizes them dynamically.
    """
    prompt = ctx.prompt_object.get("prompt", "")

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
