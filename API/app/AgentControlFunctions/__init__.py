"""
Agent Control Functions (The Toolbox).
Isolated control nodes logic for PII masking, toxicity checking, routing, and sandboxing.
"""
from app.AgentControlFunctions.registry import ControlRegistry, register_control

# Import all control function modules to trigger @register_control decorators
from app.AgentControlFunctions.guardrails import pii_presidio, toxicity_detoxify, prompt_injection
from app.AgentControlFunctions.routing import semantic_router, decision_gate
from app.AgentControlFunctions.sandboxing import firecracker_api
from app.AgentControlFunctions.evaluators import rule_engine

__all__ = ["ControlRegistry", "register_control"]
