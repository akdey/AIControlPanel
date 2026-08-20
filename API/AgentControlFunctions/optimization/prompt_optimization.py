import jinja2
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

DEFAULT_OPTIMIZATION_TEMPLATE = """### System Role & Context:
You are a {{ system_role }}.

### Primary Task & User Query:
{{ prompt }}

### Execution Guidelines:
1. Provide a direct, factual, and well-structured response.
2. Ensure safety and policy compliance across all outputs.
"""

@register_control(["prompt_optimization"])
def optimize_prompt(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Production Dynamic Prompt Optimizer & Structurer.
    Renders prompts through Jinja2 prompt template engine based on configured prompt engineering structures.
    """
    prompt = ctx.prompt_object.get("prompt", "").strip()
    system_role = config_values.get("system_role", "helpful, accurate, and concise AI assistant")
    custom_template = config_values.get("prompt_template", DEFAULT_OPTIMIZATION_TEMPLATE)

    try:
        jinja_env = jinja2.Environment(autoescape=False)
        template_obj = jinja_env.from_string(custom_template)
        optimized_prompt = template_obj.render(
            prompt=prompt,
            system_role=system_role,
            user_id=ctx.prompt_object.get("user_id", "anonymous"),
            metadata=ctx.metadata
        )
    except Exception:
        optimized_prompt = prompt

    ctx.prompt_object["prompt"] = optimized_prompt
    ctx.sanitized_prompt_object["prompt"] = optimized_prompt
    ctx.metadata["prompt_optimized"] = True
    ctx.metadata["template_rendered"] = True
