import logging
from typing import Dict, Any, List

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

# Initialize Yelp detect-secrets OSS scanning plugins
try:
    from detect_secrets.core.scan import scan_line
    from detect_secrets.settings import default_settings
    HAS_DETECT_SECRETS = True
except Exception as e:
    HAS_DETECT_SECRETS = False
    logger.error(f"Critical: Yelp detect-secrets library failed to load ({e})")

@register_control(["secret_scanner"])
def scan_secrets(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Production Fail-Closed Secret Scanner using Yelp detect-secrets OSS engine.
    Strict Fail-Closed Policy: If detect-secrets engine is offline or fails, halts execution immediately
    to prevent exposing credentials to downstream LLMs.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    detected_secrets: List[Dict[str, Any]] = []

    if not HAS_DETECT_SECRETS:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Secret Leakage Scanner"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: detect-secrets Scanner not loaded. Halted under Fail-Closed policy."
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
        return ctx

    try:
        with default_settings():
            lines = prompt.splitlines() if prompt else [""]
            for idx, line in enumerate(lines, start=1):
                for secret in scan_line(line):
                    # Filter out natural-language entropy false positives on short words (< 24 chars)
                    # Structured credentials (AWS, Stripe, Slack, PrivateKey, GitHub, etc.) are always included
                    is_entropy_only = secret.type in ["Base64 High Entropy String", "Hex High Entropy String"]
                    secret_val = getattr(secret, "secret_value", "") or ""
                    
                    if is_entropy_only and len(secret_val) < 24:
                        continue

                    detected_secrets.append({
                        "type": secret.type,
                        "hashed_token": getattr(secret, "secret_hash", "") or secret_val,
                        "line_number": idx
                    })
    except Exception as e:
        logger.error(f"detect-secrets evaluation exception ({e})")
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Secret Leakage Scanner"
        ctx.trigger_reason = f"Secret Security Evaluation Error ({str(e)}). Halted under Fail-Closed policy."
        return ctx

    ctx.metadata["secrets_detected"] = detected_secrets
    ctx.metadata["secrets_count"] = len(detected_secrets)

    if detected_secrets:
        action = config_values.get("action", "BLOCK").upper()
        if action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"Yelp detect-secrets OSS engine detected exposed credentials ({len(detected_secrets)} secret(s) found)."
        elif action == "REDACT":
            sanitized = prompt
            for sec in detected_secrets:
                secret_type = sec.get("type", "SECRET").upper().replace(" ", "_")
                line_idx = min(sec.get("line_number", 1) - 1, len(lines) - 1)
                lines[line_idx] = f"[REDACTED_{secret_type}]"
                sanitized = "\n".join(lines)
            ctx.sanitized_prompt_object["prompt"] = sanitized
            ctx.prompt_object["prompt"] = sanitized
            ctx.redaction_metadata["secrets_redacted"] = len(detected_secrets)
