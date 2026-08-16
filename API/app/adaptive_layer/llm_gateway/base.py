from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class LLMGatewayProvider(ABC):
    """
    Abstract Base Class for Gateway Providers (LiteLLM, AWS Bedrock Gateway, Portkey).
    Isolates UI & Business Logic from vendor specific Admin/Proxy APIs.
    """

    @abstractmethod
    async def generate_agent_key(self, agent_id: str, agent_name: str, team_id: Optional[str] = None) -> Dict[str, Any]:
        """Generate API Key scoped to an Agent."""
        pass

    @abstractmethod
    async def configure_model_fallback(self, primary_model: str, fallback_models: list) -> Dict[str, Any]:
        """Configure fallback dynamic routing rule."""
        pass

    @abstractmethod
    async def invoke_chat_completion(self, model: str, messages: list, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Proxy execution to gateway chat completion endpoint."""
        pass
