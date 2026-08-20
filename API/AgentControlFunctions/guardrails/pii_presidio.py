import time
import logging
from typing import Dict, Any

from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

logger = logging.getLogger(__name__)

# Initialize Production Presidio Analyzer & Anonymizer Engines
presidio_analyzer_engine = AnalyzerEngine()
presidio_anonymizer_engine = AnonymizerEngine()

@register_control(["presidio_analyzer"])
def execute_pii_presidio(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Production Microsoft Presidio PII Masking & Redaction Engine.
    Scans prompt for PII (SSN, Email, Phone, Credit Card, IP) and redacts values using Presidio NLP.
    """
    start_time = time.time()
    input_text = ctx.prompt_object.get("prompt", "")

    results = presidio_analyzer_engine.analyze(text=input_text, language="en")
    redactions_found = [res.entity_type for res in results]

    if results:
        anonymized_result = presidio_anonymizer_engine.anonymize(text=input_text, analyzer_results=results)
        sanitized_text = anonymized_result.text
    else:
        sanitized_text = input_text

    ctx.sanitized_prompt_object = dict(ctx.prompt_object)
    ctx.sanitized_prompt_object["prompt"] = sanitized_text
    ctx.prompt_object["prompt"] = sanitized_text

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
