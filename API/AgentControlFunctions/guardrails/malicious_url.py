import re
import logging
import httpx
import tldextract
from typing import Dict, Any, List

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext
from core.config import settings

logger = logging.getLogger(__name__)

URL_PATTERN = re.compile(r"https?://[^\s/$.?#].[^\s]*", re.IGNORECASE)

@register_control(["malicious_url"])
def check_urls(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Production Malicious URL & Phishing Domain Scanner.
    Extracts URLs, parses TLDs via tldextract (IANA Public Suffix List), and queries live
    URLhaus / Threat Intelligence reputation APIs.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    urls_found = URL_PATTERN.findall(prompt)
    urlhaus_api_url = getattr(settings, "URLHAUS_API_URL", "https://urlhaus-api.abuse.ch/v1/url/")

    flagged_urls: List[str] = []
    parsed_domains: List[Dict[str, str]] = []

    for url in urls_found:
        extracted = tldextract.extract(url)
        domain = f"{extracted.domain}.{extracted.suffix}"
        parsed_domains.append({
            "url": url,
            "domain": domain,
            "subdomain": extracted.subdomain,
            "tld": extracted.suffix
        })

        # Query Live Threat Intelligence API (URLhaus Abuse.ch)
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.post(urlhaus_api_url, data={"url": url})
                if res.status_code == 200:
                    query_res = res.json()
                    if query_res.get("query_status") == "ok" and query_res.get("url_status") == "online":
                        flagged_urls.append(url)
        except Exception as e:
            logger.debug(f"Live URL reputation lookup offline ({e}); proceeding with domain parsing.")

    ctx.metadata["urls_found"] = urls_found
    ctx.metadata["parsed_domains"] = parsed_domains
    ctx.metadata["flagged_urls"] = flagged_urls

    if flagged_urls:
        configured_action = config_values.get("action", "BLOCK").upper()
        if configured_action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"Malicious URL Guardrail detected active phishing link(s): {', '.join(flagged_urls)}"
