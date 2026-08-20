from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

@register_control(["hitl_approval", "human_approval_gate"])
def gate_approval(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Human-in-the-Loop (HITL) Approval Gate.
    Checks risk thresholds to determine auto-approval or routing to human operator review.
    """
    risk_score = ctx.metadata.get("risk_score", 0.0)
    auto_approve_threshold = config_values.get("auto_approve_below_score", 0.3)

    if risk_score <= auto_approve_threshold:
        ctx.metadata["next_handle_id"] = "out_approved"
        ctx.metadata["hitl_status"] = "auto_approved"
    else:
        ctx.metadata["next_handle_id"] = "out_rejected"
        ctx.metadata["hitl_status"] = "pending_human_review"
