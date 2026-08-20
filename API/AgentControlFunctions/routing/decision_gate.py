import time
from typing import Dict, Any
from AgentControlFunctions.context import PipelineContext
from AgentControlFunctions.registry import register_control

@register_control(["decision_gate"])
def execute_decision_gate(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Decision Gate Node: Evaluates accumulated taint flags and context status.
    Routes payload to 'out_pass' or 'out_block'.
    """
    start_time = time.time()
    block_on_pii = node_config.get("block_on_pii", False)

    # 1. Critical Security Violation (Toxicity, Injection, or Halt signals)
    if "TOXICITY_FLAG" in ctx.taint_flags or "PROMPT_INJECTION" in ctx.taint_flags or "PROMPT_INJECTION_DETECTED" in ctx.taint_flags:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = node_config.get("label", "Decision Gate")
        ctx.trigger_reason = f"Security violation detected in taint flags: {ctx.taint_flags}"
        ctx.last_evaluated_output_port = "out_block"
        ctx.metadata["next_handle_id"] = "out_block"
        status = "blocked"

    # 2. Strict PII Policy Violation (if configured to block on PII)
    elif "PII_DETECTED" in ctx.taint_flags and block_on_pii:
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.intercepted_control = node_config.get("label", "Decision Gate")
        ctx.trigger_reason = "Unsanitized PII detected under strict blocking policy."
        ctx.last_evaluated_output_port = "out_block"
        ctx.metadata["next_handle_id"] = "out_block"
        status = "blocked"

    # 3. Passed Gate Policy
    else:
        ctx.execution_status = "passed"
        if not ctx.action_taken:
            ctx.action_taken = "Allow"
        ctx.last_evaluated_output_port = "out_pass"
        ctx.metadata["next_handle_id"] = "out_pass"
        status = "passed"

    end_time = time.time()
    ctx.add_span(
        node_id=ctx.current_node_id,
        node_name=node_config.get("label", "Decision Gate"),
        node_type="router",
        start_time=start_time,
        end_time=end_time,
        status=status,
        input_payload=ctx.sanitized_prompt_object,
        output_payload={
            "decisionPort": ctx.last_evaluated_output_port,
            "taintFlags": list(ctx.taint_flags)
        },
        error_details=ctx.trigger_reason if status == "blocked" else None
    )

    return ctx
