import logging
import tiktoken
from typing import Dict, Any

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

# Initialize Production Tiktoken Encoding
tiktoken_encoding = tiktoken.get_encoding("cl100k_base")

@register_control(["context_truncator"])
def truncate_context(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Production Context Window Truncator using tiktoken.
    Truncates conversation context when total tokens exceed max_token_budget.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    max_budget = int(config_values.get("max_token_budget", 4096))

    tokens = tiktoken_encoding.encode(prompt)
    if len(tokens) > max_budget:
        truncated_tokens = tokens[-max_budget:]
        truncated_text = tiktoken_encoding.decode(truncated_tokens)
        ctx.metadata["truncated"] = True
        ctx.metadata["original_token_count"] = len(tokens)
        ctx.metadata["truncated_token_count"] = len(truncated_tokens)
    else:
        truncated_text = prompt
        ctx.metadata["truncated"] = False
        ctx.metadata["original_token_count"] = len(tokens)

    ctx.prompt_object["prompt"] = truncated_text
    ctx.sanitized_prompt_object["prompt"] = truncated_text
