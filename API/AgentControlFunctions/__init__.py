"""
Agent Control Functions (The Toolbox).
Isolated control nodes logic for Phase 1 controls: PII masking, secret scanning, toxicity,
prompt injection, PHI redacting, malicious URL checking, SQL AST guardrails, tool RBAC, LLMLingua2 prompt compression, and routing.
"""
from AgentControlFunctions.registry import ControlRegistry, register_control

# Import all active Phase 1 control function modules to trigger @register_control decorators
from AgentControlFunctions.guardrails import pii_presidio, toxicity_detoxify, prompt_injection, secret_scanner, malicious_url, phi_redactor
from AgentControlFunctions.routing import semantic_router, decision_gate, ab_testing
from AgentControlFunctions.sandboxing import sql_guardrail, tool_sanitizer
from AgentControlFunctions.optimization import prompt_compression, semantic_cache
from AgentControlFunctions.finops import model_router, context_truncator, rate_limiter

__all__ = ["ControlRegistry", "register_control"]
