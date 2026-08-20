import re
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

# Regex patterns for Medical Record Numbers (MRN) and Health Plan IDs
MRN_PATTERN = re.compile(r"\bMRN[-\s]?[0-9]{6,10}\b", re.IGNORECASE)
HEALTH_ID_PATTERN = re.compile(r"\bHPID[-\s]?[0-9]{8,12}\b", re.IGNORECASE)

@register_control(["phi_redactor", "hipaa_scrubber"])
def scrub_phi(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    HIPAA PHI Compliance Scrubber for Medical Record Numbers and Patient IDs.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    redact_mrn = config_values.get("redact_mrn", True)

    scrubbed = prompt
    phi_count = 0

    if redact_mrn:
        mrn_matches = MRN_PATTERN.findall(scrubbed)
        if mrn_matches:
            phi_count += len(mrn_matches)
            scrubbed = MRN_PATTERN.sub("[REDACTED_MRN]", scrubbed)

        hpid_matches = HEALTH_ID_PATTERN.findall(scrubbed)
        if hpid_matches:
            phi_count += len(hpid_matches)
            scrubbed = HEALTH_ID_PATTERN.sub("[REDACTED_HEALTH_PLAN_ID]", scrubbed)

    if phi_count > 0:
        ctx.prompt_object["prompt"] = scrubbed
        ctx.sanitized_prompt_object["prompt"] = scrubbed
        ctx.metadata["phi_scrubbed_count"] = phi_count
        ctx.redaction_metadata["phi_entities"] = phi_count
