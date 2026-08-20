import time
from typing import Dict, Any
from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

@register_control(["decision_gate"])
def execute_decision_gate(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Dynamic Decision Gate Node:
    Evaluates incoming port data, taint flags, and security status.
    Dynamically routes to configured pass/block handles without hardcoded assumptions.
    """
    start_time = time.time()
    block_on_pii = node_config.get("block_on_pii", False)
    on_pass_handle = node_config.get("on_pass_handle", "out_pass")
    on_block_handle = node_config.get("on_block_handle", "out_block")

    # Check incoming port data for upstream block indicators
    incoming_blocked = False
    for port_name, port_data in ctx.current_inputs.items():
        if isinstance(port_data, dict) and port_data.get("status") == "blocked":
            incoming_blocked = True
            break

    # 1. Critical Security Violation (Blocked status, taint flags, or blocked incoming port)
    if ctx.is_blocked or incoming_blocked or any("INJECTION" in f or "TOXIC" in f or "SECRET" in f for f in ctx.taint_flags):
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = node_config.get("label", "Decision Gate")
        if not ctx.trigger_reason:
            ctx.trigger_reason = f"Security violation detected in context: {ctx.taint_flags}"
        ctx.last_evaluated_output_port = on_block_handle
        ctx.metadata["next_handle_id"] = on_block_handle
        status = "blocked"

    # 2. Strict PII Policy Violation (if configured to block on PII)
    elif "PII_DETECTED" in ctx.taint_flags and block_on_pii:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = node_config.get("label", "Decision Gate")
        ctx.trigger_reason = "Unsanitized PII detected under strict blocking policy."
        ctx.last_evaluated_output_port = on_block_handle
        ctx.metadata["next_handle_id"] = on_block_handle
        status = "blocked"

    # 3. Passed Gate Policy
    else:
        ctx.execution_status = "passed"
        if not ctx.action_taken:
            ctx.action_taken = "Allow"
        ctx.last_evaluated_output_port = on_pass_handle
        ctx.metadata["next_handle_id"] = on_pass_handle
        status = "passed"

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Decision Gate"),
        node_type="router",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload=ctx.sanitized_prompt_object or ctx.prompt_object,
        output_payload={
            "decisionPort": ctx.last_evaluated_output_port,
            "taintFlags": list(ctx.taint_flags)
        },
        error_details=ctx.trigger_reason if status == "blocked" else None
    )

    return ctx
