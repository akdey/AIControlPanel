from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class UnifiedSpan(BaseModel):
    id: str
    traceId: str
    nodeId: str
    nodeName: str
    nodeType: str
    startTime: float
    endTime: float
    durationMs: float
    status: str  # passed, blocked, halted, mutated, cached
    inputPayload: Optional[Any] = None
    outputPayload: Optional[Any] = None
    mutatedFields: Optional[List[str]] = Field(default_factory=list)
    taintFlags: Optional[List[str]] = Field(default_factory=list)
    tokenCost: Optional[float] = 0.0
    errorDetails: Optional[str] = None

class UnifiedTrace(BaseModel):
    id: str
    timestamp: str
    agentId: str
    agentName: str
    projectName: str
    totalDurationMs: float
    status: str  # passed, blocked, halted
    interceptedControl: Optional[str] = None
    triggerReason: Optional[str] = None
    actionTaken: Optional[str] = None  # Halt, Redact, Route Fallback, Alert
    spans: List[UnifiedSpan] = Field(default_factory=list)
    ingestedPayload: Optional[Any] = None
    finalPayload: Optional[Any] = None
    modelUsed: str = "gpt-4o"
    totalTokens: int = 0
    estimatedCost: float = 0.0

class CostByAgent(BaseModel):
    agentId: str
    agentName: str
    spend: float
    percentage: float

class CostByModel(BaseModel):
    modelName: str
    tokens: int
    cost: float
    percentage: float

class UnifiedMetric(BaseModel):
    totalSpendCurrentMonth: float
    monthlyBudgetCap: float
    projectedSpendMonthEnd: float
    semanticCacheSavings: float
    contextPruningSavings: float
    slmOffloadingSavings: float
    costByAgent: List[CostByAgent] = Field(default_factory=list)
    costByModel: List[CostByModel] = Field(default_factory=list)
    circuitBreakerActive: bool
    circuitBreakerThreshold: float
    circuitBreakerAction: str  # drop_to_slm, halt_non_critical, reject_all
