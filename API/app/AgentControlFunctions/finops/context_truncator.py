from typing import Dict, Any
from app.AgentControlFunctions.registry import register_control
from app.AgentControlFunctions.context import PipelineContext

@register_control(["context_truncator", "window_truncator"])
def truncate_context(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Context Window Truncator.
    Truncates conversation history when total tokens exceed max_token_budget.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    max_budget = config_values.get("max_token_budget", 4096)

    words = prompt.split()
    if len(words) > max_budget:
        truncated_words = words[-max_budget:]
        truncated_text = " ".join(truncated_words)
        ctx.metadata["truncated"] = True
        ctx.metadata["original_word_count"] = len(words)
        ctx.metadata["truncated_word_count"] = len(truncated_words)
    else:
        truncated_text = prompt
        ctx.metadata["truncated"] = False

    ctx.prompt_object["prompt"] = truncated_text
    ctx.sanitized_prompt_object["prompt"] = truncated_text
