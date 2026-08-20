from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

@register_control(["prompt_optimization", "prompt_refiner"])
def optimize_prompt(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Prompt Optimizer & Refiner.
    Rewrites raw user prompt with clear structural formatting, system instruction framing, and Markdown headers.
    """
    prompt = ctx.prompt_object.get("prompt", "")
    add_markdown = config_values.get("add_markdown_formatting", True)

    if add_markdown and not prompt.startswith("### Instruction"):
        optimized_prompt = f"### Instruction & Task Context:\n{prompt.strip()}\n\n### Response Guidelines:\nProvide a structured, accurate, and concise response."
    else:
        optimized_prompt = prompt

    ctx.prompt_object["prompt"] = optimized_prompt
    ctx.sanitized_prompt_object["prompt"] = optimized_prompt
    ctx.metadata["prompt_optimized"] = True
