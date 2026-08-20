import operator
import logging
from typing import Dict, Any, List
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

# Universal Comparison Operators
OPERATORS = {
    ">": operator.gt,
    ">=": operator.ge,
    "<": operator.lt,
    "<=": operator.le,
    "==": operator.eq,
    "!=": operator.ne,
    "contains": lambda container, val: val in container if isinstance(container, (list, set, str, dict)) else False,
    "not_contains": lambda container, val: val not in container if isinstance(container, (list, set, str, dict)) else True,
    "in": lambda val, container: val in container if isinstance(container, (list, set, str, dict)) else False,
}

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

@register_control(["generic_condition_evaluator", "rule_node", "dynamic_rule_evaluator", "expression_node"])
def evaluate_generic_rules(ctx: PipelineContext, config_values: Dict[str, Any]):
    """
    Universal Generic Condition Evaluator.
    Compares outputs from ANY preceding node in the pipeline against arbitrary conditions dynamically.
    No hardcoded domain field names — works for PII, Toxicity, FinOps, Guardrails, or any custom node.
    """
    logic = config_values.get("logic", "AND").upper()
    rules: List[Dict[str, Any]] = config_values.get("rules", [])
    action = config_values.get("action_on_match", "BLOCK").upper()

    match_results = []
    for rule in rules:
        source_node_id = rule.get("source_node_id")
        field_path = rule.get("field_path", "")
        op_str = rule.get("operator", "==")
        target_value = rule.get("value")

        # 1. Fetch source node output from ctx.node_outputs or ctx.metadata fallback
        node_output = {}
        if source_node_id and source_node_id in ctx.node_outputs:
            node_output = ctx.node_outputs[source_node_id]
        else:
            node_output = ctx.metadata

        # 2. Extract specific field value via path
        actual_value = resolve_nested_path(node_output, field_path)

        # 3. Evaluate operator
        op_func = OPERATORS.get(op_str, operator.eq)
        try:
            # Cast numeric comparisons if target is numeric
            if op_str in [">", ">=", "<", "<="] and isinstance(target_value, (int, float)):
                actual_value = float(actual_value) if actual_value is not None else 0.0
                target_value = float(target_value)
            matched = bool(op_func(actual_value, target_value))
        except (ValueError, TypeError):
            matched = False

        match_results.append(matched)

    # 4. Aggregate results (AND / OR)
    if logic == "OR":
        is_rule_triggered = any(match_results) if match_results else False
    else:  # Default "AND"
        is_rule_triggered = all(match_results) if match_results else False

    ctx.metadata["rule_evaluation_triggered"] = is_rule_triggered
    ctx.metadata["rule_match_count"] = sum(1 for r in match_results if r)

    # 5. Set output handle & action
    if is_rule_triggered:
        ctx.metadata["next_handle_id"] = config_values.get("on_true_handle", "match")
        if action == "BLOCK":
            ctx.execution_status = "blocked"
            ctx.action_taken = "Halt"
            ctx.trigger_reason = f"Dynamic Rule Evaluator matched {sum(1 for r in match_results if r)} / {len(rules)} rules ({logic})."
    else:
        ctx.metadata["next_handle_id"] = config_values.get("on_false_handle", "no_match")
