"""
Secret & Credential Scanner Control Function (Phase 1)
-----------------------------------------------------
Control ID: ctrl_secret_scanner
Engine Key: secret_scanner

How This Control Works:
1. Intercepts incoming payload prompt text from `ctx.get_input_prompt("in_payload")` or `ctx.prompt_object["prompt"]`.
2. Uses Yelp `detect-secrets` OSS engine (`detect_secrets.core.scan.scan_line`) combined with Shannon entropy calculation.
3. Identifies credentials (AWS Access Keys, Stripe API Keys, Slack Tokens, Private RSA Keys, High-Entropy Strings).
4. If secrets are detected:
   - If `action` is "BLOCK" (default): sets `ctx.execution_status = "blocked"` and `ctx.action_taken = "Halt"`, routing to output handle `out_block`.
   - If `action` is "REDACT": replaces the secret lines with `[REDACTED_SECRET]`, updating `ctx.sanitized_prompt_object["prompt"]`, routing to `out_scanned`.
5. Enforces Fail-Closed security: if `detect-secrets` is offline or fails, halts execution immediately.
"""

import logging
from typing import Dict, Any, List

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

try:
    from detect_secrets.core.scan import scan_line
    from detect_secrets.settings import default_settings
    HAS_DETECT_SECRETS = True
except Exception as e:
    HAS_DETECT_SECRETS = False
    logger.error(f"Critical: Yelp detect-secrets library failed to load ({e})")

@register_control(["secret_scanner", "ctrl_secret_scanner", "scan_secrets"])
def scan_secrets(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Yelp detect-secrets Secret & Credential Scanner.
    Inputs:
      - in_payload: Input prompt object
    Config Properties:
      - action: 'BLOCK' or 'REDACT'
    Outputs:
      - out_scanned: Clean/Redacted payload
      - out_block: Blocked secret payload
    """
    prompt = ctx.get_input_prompt("in_payload") or ctx.prompt_object.get("prompt", "")
    detected_secrets: List[Dict[str, Any]] = []

    if not HAS_DETECT_SECRETS:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = "Secret Leakage Scanner"
        ctx.trigger_reason = "Security Guardrail Engine Unavailable: detect-secrets Scanner not loaded. Halted under Fail-Closed policy."
        if "SECURITY_ENGINE_OFFLINE" not in ctx.taint_flags:
            ctx.taint_flags.append("SECURITY_ENGINE_OFFLINE")
        ctx.set_output("out_block", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_block"
        return ctx

    try:
        with default_settings():
            lines = prompt.splitlines() if prompt else [""]
            for idx, line in enumerate(lines, start=1):
                for secret in scan_line(line):
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
        ctx.set_output("out_block", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_block"
        return ctx

    ctx.metadata["secrets_detected"] = detected_secrets
    ctx.metadata["secrets_count"] = len(detected_secrets)

    if detected_secrets:
        if "SECRET_LEAK_DETECTED" not in ctx.taint_flags:
            ctx.taint_flags.append("SECRET_LEAK_DETECTED")
            
        action = node_config.get("action", "BLOCK").upper()
        if action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"Yelp detect-secrets OSS engine detected exposed credentials ({len(detected_secrets)} secret(s) found)."
            ctx.set_output("out_block", ctx.prompt_object)
            ctx.metadata["next_handle_id"] = "out_block"
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
            ctx.action_taken = "Redact"
            ctx.execution_status = "mutated"
            ctx.set_output("out_scanned", ctx.sanitized_prompt_object)
            ctx.metadata["next_handle_id"] = "out_scanned"
    else:
        ctx.set_output("out_scanned", ctx.prompt_object)
        ctx.metadata["next_handle_id"] = "out_scanned"

    return ctx
