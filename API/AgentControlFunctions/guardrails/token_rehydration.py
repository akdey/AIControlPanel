from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

@register_control(["token_rehydration"])
def rehydrate_tokens(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Data De-Anonymization Vault Rehydrator.
    Reverses redacted tokens back to original values after receiving safe completions.
    """
    llm_response = ctx.metadata.get("llm_response", {})
    response_text = llm_response.get("content", "") if isinstance(llm_response, dict) else str(llm_response)

    vault = ctx.redaction_metadata.get("token_vault", {})
    rehydrated_text = response_text

    for token, original in vault.items():
        rehydrated_text = rehydrated_text.replace(token, original)

    ctx.metadata["rehydrated_response"] = rehydrated_text
    ctx.final_output = rehydrated_text
