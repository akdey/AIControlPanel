import re
from typing import Dict, Any
from app.AgentControlFunctions.registry import register_control
from app.AgentControlFunctions.context import PipelineContext

URL_PATTERN = re.compile(r"https?://[^\s/$.?#].[^\s]*", re.IGNORECASE)
SUSPICIOUS_TLDS = [".zip", ".top", ".kim", ".xyz", ".cc", ".work", ".click", ".country"]

@register_control(["malicious_url", "url_checker"])
def check_urls(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Extracts URLs from prompts and validates domain reputation & suspicious TLDs.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    urls_found = URL_PATTERN.findall(prompt)
    block_suspicious_tlds = config_values.get("block_suspicious_tlds", True)

    flagged_urls = []
    if block_suspicious_tlds:
        for url in urls_found:
            if any(tld in url.lower() for tld in SUSPICIOUS_TLDS):
                flagged_urls.append(url)

    ctx.metadata["urls_found"] = urls_found
    ctx.metadata["flagged_urls"] = flagged_urls

    if flagged_urls:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.trigger_reason = f"Malicious URL Guardrail detected suspicious links: {', '.join(flagged_urls)}"
