from abc import ABC, abstractmethod
from typing import List, Optional
from app.adaptive_layer.observability.schemas import UnifiedTrace, UnifiedMetric

class ObservabilityProvider(ABC):
    """
    Abstract Base Class for Observability Providers (Langfuse, DataDog, Arize Phoenix).
    Enforces the Façade Pattern so the UI remains completely vendor-agnostic.
    """

    @abstractmethod
    async def fetch_traces(self, project_id: Optional[str] = None, agent_id: Optional[str] = None) -> List[UnifiedTrace]:
        """Fetch traces and map to UnifiedTrace schema."""
        pass

    @abstractmethod
    async def fetch_metrics(self, project_id: Optional[str] = None) -> UnifiedMetric:
        """Fetch metrics and map to UnifiedMetric schema."""
        pass
