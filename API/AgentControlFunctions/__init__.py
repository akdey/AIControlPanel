"""
Agent Control Functions (The Toolbox).
Isolated control nodes logic for PII masking, toxicity checking, routing, and sandboxing.
"""
from AgentControlFunctions.registry import ControlRegistry, register_control

# Import all control function modules to trigger @register_control decorators
from AgentControlFunctions.guardrails import pii_presidio, toxicity_detoxify, prompt_injection, secret_scanner, malicious_url, phi_redactor, token_rehydration
from AgentControlFunctions.routing import semantic_router, decision_gate, ab_testing, hitl_approval, opa_rbac
from AgentControlFunctions.sandboxing import firecracker_api
from AgentControlFunctions.evaluators import rule_engine
from AgentControlFunctions.optimization import prompt_compression, prompt_optimization, semantic_cache
from AgentControlFunctions.finops import model_router, context_truncator, rate_limiter

__all__ = ["ControlRegistry", "register_control"]
