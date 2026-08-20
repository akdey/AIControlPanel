"""
Agent Control Functions (The Toolbox).
Isolated control nodes logic for PII masking, toxicity checking, routing, and sandboxing.
"""
from app.AgentControlFunctions.registry import ControlRegistry, register_control

# Import all control function modules to trigger @register_control decorators
from app.AgentControlFunctions.guardrails import pii_presidio, toxicity_detoxify, prompt_injection, secret_scanner, malicious_url, phi_redactor, token_rehydration
from app.AgentControlFunctions.routing import semantic_router, decision_gate, ab_testing, hitl_approval
from app.AgentControlFunctions.sandboxing import firecracker_api
from app.AgentControlFunctions.evaluators import rule_engine
from app.AgentControlFunctions.optimization import prompt_compression, prompt_optimization
from app.AgentControlFunctions.finops import model_router, context_truncator

__all__ = ["ControlRegistry", "register_control"]
