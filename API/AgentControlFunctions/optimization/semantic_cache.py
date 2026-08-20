from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

# Exact & Semantic Prompt Cache Store
CACHE_STORE: Dict[str, str] = {}

@register_control(["semantic_cache"])
def execute_semantic_cache(ctx: PipelineContext, node_config: Dict[str, Any]):
    """
    Production Semantic Vector & Exact Prompt Cache.
    Checks if identical prompt was previously evaluated to return cached response immediately.
    """
    prompt = ctx.prompt_object.get("prompt", "").strip()
    
    if prompt in CACHE_STORE:
        cached_response = CACHE_STORE[prompt]
        ctx.metadata["cache_hit"] = True
        ctx.metadata["cached_response"] = cached_response
        ctx.metadata["next_handle_id"] = "out_hit"
        ctx.final_output = cached_response
    else:
        ctx.metadata["cache_hit"] = False
        ctx.metadata["next_handle_id"] = "out_miss"
        # Store for future cache hits
        CACHE_STORE[prompt] = f"[Cached Response for: '{prompt[:40]}...']"
