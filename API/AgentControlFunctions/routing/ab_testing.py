import zlib
from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

@register_control(["ab_testing", "canary_splitter"])
def split_traffic(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    A/B Testing & Canary Traffic Splitter.
    Determines branch routing based on user/session hashing and branch weight percentage.
    """
    user_id = ctx.prompt_object.get("user_id", ctx.pipeline_id)
    branch_a_weight = config_values.get("branch_a_weight", 80)

    # Hash user_id / session_id deterministically to integer 0-99
    hash_val = zlib.crc32(user_id.encode("utf-8")) % 100

    if hash_val < branch_a_weight:
        selected_branch = "out_branch_a"
    else:
        selected_branch = "out_branch_b"

    ctx.metadata["next_handle_id"] = selected_branch
    ctx.metadata["ab_testing_selected_branch"] = selected_branch
    ctx.metadata["ab_testing_hash_val"] = hash_val
