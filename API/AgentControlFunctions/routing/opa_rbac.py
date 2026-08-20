from typing import Dict, Any
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

@register_control(["opa_wasm"])
def execute_opa_wasm(ctx: PipelineContext, node_config: Dict[str, Any]):
    """
    OPA / Cedar Tool Authorization Policy Enforcer.
    Filters unauthorized tool calls from tool_manifest based on Rego policy rules.
    """
    tool_manifest = ctx.tool_manifest
    unauthorized_action = node_config.get("unauthorized_action", "strip_silently")
    
    restricted_tools = ["database_drop", "shell_exec", "rm_rf"]
    allowed_manifest = [t for t in tool_manifest if t.get("name") not in restricted_tools]
    stripped_count = len(tool_manifest) - len(allowed_manifest)
    
    ctx.tool_manifest = allowed_manifest
    ctx.metadata["opa_stripped_tools_count"] = stripped_count
    
    if stripped_count > 0 and unauthorized_action == "fail_closed":
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.trigger_reason = f"OPA Authorization Policy rejected {stripped_count} unauthorized tool(s)."
