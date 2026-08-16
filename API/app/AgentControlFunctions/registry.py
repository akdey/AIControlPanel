import logging
from typing import Dict, Any, Callable, Optional, List
from app.AgentControlFunctions.context import PipelineContext

logger = logging.getLogger("control_plane.registry")

class ControlRegistry:
    """
    Extensible O(1) Registry for AgentControlFunctions.
    Replaces monolithic if-else dispatching with pluggable decorator registration.
    """
    _registry: Dict[str, Callable[[PipelineContext, Dict[str, Any]], None]] = {}

    @classmethod
    def register(cls, aliases: List[str]):
        """Decorator to register a control function under one or more engine aliases."""
        def decorator(fn: Callable[[PipelineContext, Dict[str, Any]], None]):
            for alias in aliases:
                key = alias.lower().strip()
                cls._registry[key] = fn
                logger.debug(f"Registered control function '{fn.__name__}' under alias '{key}'")
            return fn
        return decorator

    @classmethod
    def get_control(cls, engine_name: str) -> Optional[Callable[[PipelineContext, Dict[str, Any]], None]]:
        """O(1) lookup for registered control function by engine alias."""
        if not engine_name:
            return None
        return cls._registry.get(engine_name.lower().strip())

    @classmethod
    def list_registered_controls(cls) -> List[str]:
        return list(cls._registry.keys())

def register_control(aliases: List[str]):
    return ControlRegistry.register(aliases)
