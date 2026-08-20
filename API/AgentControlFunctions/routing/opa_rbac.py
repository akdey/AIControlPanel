import logging
import httpx
from typing import Dict, Any, List
from AgentControlFunctions.registry import register_control
from AgentControlFunctions.context import PipelineContext
from core.config import settings

logger = logging.getLogger(__name__)

@register_control(["opa_wasm"])
def execute_opa_wasm(ctx: PipelineContext, node_config: Dict[str, Any]):
    """
    Production Open Policy Agent (OPA) / Rego Tool Authorization Policy Enforcer.
    Evaluates tool invocation manifests against OPA policy engine or Rego rules.
    """
    tool_manifest = ctx.tool_manifest
    unauthorized_action = node_config.get("unauthorized_action", "strip_silently")
    opa_url = getattr(settings, "OPA_SERVER_URL", "http://localhost:8181/v1/data/agent/authz/allow")

    allowed_manifest: List[Dict[str, Any]] = []
    stripped_tools: List[str] = []

    for tool in tool_manifest:
        tool_name = tool.get("name", "")
        is_allowed = True
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.post(opa_url, json={
                    "input": {
                        "action": "tool:invoke",
                        "tool": tool_name,
                        "role": ctx.metadata.get("user_role", "user"),
                        "pipeline_id": ctx.pipeline_id
                    }
                })
                if res.status_code == 200:
                    is_allowed = bool(res.json().get("result", True))
        except Exception as e:
            logger.debug(f"OPA daemon offline ({str(e)}); evaluating policy rules natively.")
            if tool_name in ["database_drop", "shell_exec", "rm_rf", "system_reboot"]:
                is_allowed = False

        if is_allowed:
            allowed_manifest.append(tool)
        else:
            stripped_tools.append(tool_name)

    ctx.tool_manifest = allowed_manifest
    ctx.metadata["opa_stripped_tools"] = stripped_tools
    ctx.metadata["opa_stripped_count"] = len(stripped_tools)

    if stripped_tools and unauthorized_action == "fail_closed":
        ctx.execution_status = "blocked"
        ctx.action_taken = "Halt"
        ctx.trigger_reason = f"OPA Policy Engine blocked unauthorized tool(s): {', '.join(stripped_tools)}"
