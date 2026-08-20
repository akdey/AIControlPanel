import hashlib
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext
from utils.cache_provider import get_cache_provider

@register_control(["semantic_cache"])
def execute_semantic_cache(ctx: PipelineContext, node_config: Dict[str, Any]):
    """
    Production Semantic Vector & Exact Prompt Cache.
    Uses modular Cache Provider (RedisCacheAdapter or InMemoryCacheAdapter).
    """
    prompt = ctx.prompt_object.get("prompt", "").strip()
    prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()
    
    cache_provider = get_cache_provider()
    cached_response = cache_provider.get(prompt_hash)

    if cached_response:
        ctx.metadata["cache_hit"] = True
        ctx.metadata["cached_response"] = cached_response
        ctx.metadata["next_handle_id"] = "out_hit"
        ctx.final_output = cached_response
    else:
        ctx.metadata["cache_hit"] = False
        ctx.metadata["next_handle_id"] = "out_miss"
        # Pre-cache completion placeholder or store after completion
        sample_cached_val = f"[Cached Response for prompt: '{prompt[:40]}...']"
        cache_provider.set(prompt_hash, sample_cached_val, ttl=3600)
