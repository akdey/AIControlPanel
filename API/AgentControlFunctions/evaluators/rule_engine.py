import logging
from typing import Dict, Any, List
from simpleeval import simple_eval

from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

def resolve_nested_path(data: Any, path: str) -> Any:
    """Extracts value from nested dict/list using dot notation (e.g. 'metadata.score' or '0.name')."""
    if not path or data is None:
        return data
    for key in path.split("."):
        if isinstance(data, dict):
            data = data.get(key)
        elif isinstance(data, list) and key.isdigit():
            idx = int(key)
            data = data[idx] if 0 <= idx < len(data) else None
        else:
            return None
    return data

@register_control(["generic_condition_evaluator"])
def evaluate_generic_rules(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Production Generic Condition & Expression Evaluator using simpleeval OSS engine.
    Evaluates dynamic Python expressions against outputs from ANY preceding node in the pipeline context.
    """
    logic = config_values.get("logic", "AND").upper()
    rules: List[Dict[str, Any]] = config_values.get("rules", [])
    action = config_values.get("action_on_match", "BLOCK").upper()

    match_results = []
    eval_names = {
        "ctx": ctx,
        "prompt": ctx.prompt_object.get("prompt", ""),
        "metadata": ctx.metadata,
        "taint_flags": ctx.taint_flags,
        "node_outputs": ctx.node_outputs
    }

    for rule in rules:
        expr = rule.get("expression")
        if expr:
            try:
                matched = bool(simple_eval(expr, names=eval_names))
            except Exception as e:
                logger.warning(f"simpleeval expression evaluation error ({e})")
                matched = False
        else:
            source_node_id = rule.get("source_node_id")
            field_path = rule.get("field_path", "")
            op_str = rule.get("operator", "==")
            target_value = rule.get("value")

            node_output = ctx.node_outputs.get(source_node_id, ctx.metadata) if source_node_id else ctx.metadata
            actual_value = resolve_nested_path(node_output, field_path)

            try:
                op_expr = f"val {op_str} target" if op_str not in ["contains", "in"] else f"target in val"
                matched = bool(simple_eval(op_expr, names={"val": actual_value, "target": target_value}))
            except Exception:
                matched = (actual_value == target_value)

        match_results.append(matched)

    if logic == "OR":
        is_rule_triggered = any(match_results) if match_results else False
    else:
        is_rule_triggered = all(match_results) if match_results else False

    ctx.metadata["rule_evaluation_triggered"] = is_rule_triggered
    ctx.metadata["rule_match_count"] = sum(1 for r in match_results if r)

    if is_rule_triggered:
        ctx.metadata["next_handle_id"] = config_values.get("on_true_handle", "match")
        if action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"SimpleEval OSS Expression Evaluator matched {sum(1 for r in match_results if r)} / {len(rules)} rules ({logic})."
    else:
        ctx.metadata["next_handle_id"] = config_values.get("on_false_handle", "no_match")
