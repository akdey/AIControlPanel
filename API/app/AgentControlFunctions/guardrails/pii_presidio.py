import re
import time
from typing import Dict, Any
from app.AgentControlFunctions.context import PipelineContext
from app.AgentControlFunctions.registry import register_control

# PII regex patterns for presidio analyzer simulation
PII_PATTERNS = {
    "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
    "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "PHONE": r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
    "CREDIT_CARD": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
}

@register_control(["presidio_analyzer", "pii_presidio", "ctrl_pii_masking", "pii_masking"])
def execute_pii_presidio(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Scans prompt for PII (SSN, Email, Phone, Credit Card), redacts matched patterns,
    updates sanitized_prompt_object and redaction_metadata.
    """
    start_time = time.time()
    input_text = ctx.prompt_object.get("prompt", "")
    
    sanitized_text = input_text
    redactions_found = []
    
    for pii_type, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, sanitized_text)
        if matches:
            redactions_found.extend(matches)
            sanitized_text = re.sub(pattern, f"[REDACTED_{pii_type}]", sanitized_text)
    
    ctx.sanitized_prompt_object = dict(ctx.prompt_object)
    ctx.sanitized_prompt_object["prompt"] = sanitized_text
    ctx.prompt_object["prompt"] = sanitized_text
    
    mutated_fields = []
    if redactions_found:
        if "PII_DETECTED" not in ctx.taint_flags:
            ctx.taint_flags.append("PII_DETECTED")
        ctx.redaction_metadata["pii_redacted_count"] = len(redactions_found)
        ctx.redaction_metadata["types"] = list(PII_PATTERNS.keys())
        ctx.action_taken = "Redact"
        mutated_fields.append("prompt")
        status = "mutated"
    else:
        status = "passed"

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "PII Presidio Analyzer"),
        node_type="guardrail",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload={"prompt": input_text},
        output_payload={"sanitized_prompt": sanitized_text, "redactions": len(redactions_found)},
        mutated_fields=mutated_fields
    )
    
    return ctx
