from adaptive_layer.llm_gateway.base import LLMGatewayProvider
from adaptive_layer.llm_gateway.litellm_adapter import LiteLLMAdapter

def get_llm_gateway() -> LLMGatewayProvider:
    """
    Factory function returning the configured LLM Gateway Provider via Adaptive Layer.
    Ensures feature slices interact ONLY with the LLMGatewayProvider interface.
    """
    return LiteLLMAdapter()

__all__ = ["LLMGatewayProvider", "get_llm_gateway", "LiteLLMAdapter"]
