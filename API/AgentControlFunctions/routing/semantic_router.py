import time
from typing import Dict, Any
from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

@register_control(["semantic_router"])
def execute_semantic_router(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Evaluates prompt semantics and decides whether to route payload to SLM, LLM, or Fallback.
    """
    start_time = time.time()
    text = ctx.sanitized_prompt_object.get("prompt", ctx.prompt_object.get("prompt", "")).lower()

    # Classify intent & complexity
    if len(text.split()) < 15 and "simple" in text:
        branch = "slm_route"
    elif "fallback" in text or "error" in text:
        branch = "fallback_route"
    else:
        branch = "llm_route"

    ctx.routing_decision = branch
    ctx.metadata["next_handle_id"] = branch

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Semantic Router"),
        node_type="router",
        start_time=start_time,
        end_time=end_time,
        status="passed",
        input_payload={"prompt": text[:100]},
        output_payload={"decisionBranch": branch, "target_node_id": ctx.next_node_id}
    )

    return ctx
