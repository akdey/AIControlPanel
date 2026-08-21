"""
Tool Manifest RBAC & Permission Sanitizer Control Function (Phase 1)
---------------------------------------------------------------------
Control ID: ctrl_tool_sanitizer
Engine Key: tool_sanitizer

How This Control Works:
1. When an agent framework (e.g. LiteLLM, LangGraph, or OpenAI Assistant API) passes a request payload,
   it includes a list of available tools (`tools` array containing function schemas).
2. This control inspects `ctx.tool_manifest` (or `ctx.current_inputs["in_tools"]`).
3. It parses the configured `allowed_tools` and `blocked_tools` rules from node_config:
   - If `blocked_tools` matches a tool name (e.g. `delete_user`, `execute_sql`), the tool schema is removed from the manifest.
   - If `allowed_tools` is specified (and not '*'), only tools explicitly listed in `allowed_tools` are retained.
4. The sanitized tool array is saved back to `ctx.tool_manifest` and emitted on output port `out_sanitized`.
5. This prevents Excessive Agency (OWASP LLM03) by dynamically stripping unauthorized tool access before the LLM sees the prompt.
"""

import logging
from typing import Dict, Any, List
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext

logger = logging.getLogger(__name__)

@register_control(["tool_sanitizer", "filter_tools"])
def execute_tool_sanitizer(ctx: PipelineContext, node_config: Dict[str, Any]) -> PipelineContext:
    """
    Filters function schemas in `ctx.tool_manifest` using explicit allow/block rules.
    Inputs:
      - in_tools: Optional tool list payload from connected upstream handle.
    Config Properties:
      - allowed_tools: Comma-separated list of allowed tool names or '*'
      - blocked_tools: Comma-separated list of forbidden tool names
    Outputs:
      - out_sanitized: The mutated tool array
    """
    raw_tools = ctx.get_input("in_tools") or ctx.tool_manifest or []
    if not isinstance(raw_tools, list):
        raw_tools = []

    allowed_str = str(node_config.get("allowed_tools", "*")).strip()
    blocked_str = str(node_config.get("blocked_tools", "")).strip()

    allowed_set = {t.strip() for t in allowed_str.split(",") if t.strip()}
    blocked_set = {t.strip() for t in blocked_str.split(",") if t.strip()}

    sanitized_tools = []
    removed_tools = []

    for tool_item in raw_tools:
        # Resolve tool name from standard OpenAI tool format or raw function dict
        tool_name = ""
        if isinstance(tool_item, dict):
            if "function" in tool_item and isinstance(tool_item["function"], dict):
                tool_name = tool_item["function"].get("name", "")
            else:
                tool_name = tool_item.get("name", "")

        if not tool_name:
            sanitized_tools.append(tool_item)
            continue

        # Check blocklist
        if tool_name in blocked_set:
            removed_tools.append(tool_name)
            continue

        # Check allowlist
        if "*" not in allowed_set and tool_name not in allowed_set:
            removed_tools.append(tool_name)
            continue

        sanitized_tools.append(tool_item)

    # Update context
    ctx.tool_manifest = sanitized_tools
    ctx.metadata["sanitized_tools_removed"] = removed_tools
    ctx.set_output("out_sanitized", sanitized_tools)

    if removed_tools:
        ctx.action_taken = "Mutate"
        ctx.execution_status = "mutated"
        logger.info(f"[ctrl_tool_sanitizer] Stripped {len(removed_tools)} forbidden tools: {removed_tools}")

    return ctx
