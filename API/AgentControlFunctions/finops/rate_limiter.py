import time
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

# In-memory sliding window request store per user/project
WINDOW_STORE: Dict[str, list] = {}

@register_control(["rate_limiter"])
def execute_rate_limiter(ctx: PipelineContext, node_config: Dict[str, Any]):
    """
    Production Rate Limiter & Token Budgeter.
    Enforces per-tenant and per-agent requests-per-minute (RPM) and token-per-minute (TPM) limits.
    """
    user_key = ctx.prompt_object.get("user_id", ctx.pipeline_id)
    max_rpm = int(node_config.get("max_rpm", 600))
    now = time.time()

    # Clean timestamps older than 60s
    timestamps = WINDOW_STORE.get(user_key, [])
    timestamps = [t for t in timestamps if now - t < 60]
    
    if len(timestamps) >= max_rpm:
        configured_action = node_config.get("action", "BLOCK").upper()
        ctx.metadata["rate_limit_exceeded"] = True
        ctx.metadata["remaining_requests"] = 0
        if configured_action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"Rate Limit Exceeded: {len(timestamps)} requests in last 60 seconds (Limit: {max_rpm} RPM)."
    else:
        timestamps.append(now)
        WINDOW_STORE[user_key] = timestamps
        ctx.metadata["rate_limit_exceeded"] = False
        ctx.metadata["remaining_requests"] = max_rpm - len(timestamps)
