from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

@register_control(["model_router"])
def route_model(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Dynamic Model Router (Cost vs Quality Optimization).
    Evaluates prompt token length & complexity to select the optimal model (e.g. gpt-4o-mini vs gpt-4o).
    Sets ctx.metadata["selected_model"], which LiteLLM Gateway consumes natively.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    fast_model = config_values.get("fast_model", "gpt-4o-mini")
    premium_model = config_values.get("premium_model", "gpt-4o")
    threshold = config_values.get("complexity_token_threshold", 500)

    token_count_approx = len(prompt.split())

    if token_count_approx > threshold or "complex" in prompt.lower() or "reasoning" in prompt.lower():
        selected_model = premium_model
        reason = f"Prompt complexity/length ({token_count_approx} tokens) exceeded threshold ({threshold})."
    else:
        selected_model = fast_model
        reason = f"Prompt length ({token_count_approx} tokens) within fast model budget."

    ctx.metadata["selected_model"] = selected_model
    ctx.metadata["routing_reason"] = reason
