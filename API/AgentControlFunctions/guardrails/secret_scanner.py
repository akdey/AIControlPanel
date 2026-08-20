import re
from typing import Dict, Any, List
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

# Regex patterns for credentials, API keys, JWTs, AWS keys
SECRET_PATTERNS = {
    "AWS Access Key": re.compile(r"(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"),
    "Generic API Key": re.compile(r"(?i)(api[_-]?key|secret[_-]?key|access[_-]?token)[\s=:\'\"]+([a-zA-Z0-9_\-]{20,})"),
    "JWT Token": re.compile(r"ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),
    "Private Key": re.compile(r"-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----"),
    "GitHub Personal Access Token": re.compile(r"ghp_[a-zA-Z0-9]{36}"),
}

@register_control(["secret_scanner", "secret_detector"])
def scan_secrets(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Scans prompt text and metadata for accidental exposure of secrets and API keys.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    detected_secrets: List[Dict[str, str]] = []

    for secret_type, pattern in SECRET_PATTERNS.items():
        matches = pattern.findall(prompt)
        if matches:
            detected_secrets.append({"type": secret_type, "count": len(matches)})

    if detected_secrets:
        ctx.metadata["secrets_detected"] = detected_secrets
        action = config_values.get("action", "BLOCK").upper()

        if action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"Secret Leakage Scanner detected sensitive credentials ({len(detected_secrets)} types found)."
        elif action == "REDACT":
            sanitized = prompt
            for secret_type, pattern in SECRET_PATTERNS.items():
                sanitized = pattern.sub(f"[REDACTED_{secret_type.upper().replace(' ', '_')}]", sanitized)
            ctx.sanitized_prompt_object["prompt"] = sanitized
            ctx.prompt_object["prompt"] = sanitized
            ctx.redaction_metadata["secrets_redacted"] = len(detected_secrets)
