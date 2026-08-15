export interface CostByAgent {
  agentId: string;
  agentName: string;
  spend: number;
  percentage: number;
}

export interface CostByModel {
  modelName: string;
  tokens: number;
  cost: number;
  percentage: number;
}

export interface FinOpsData {
  totalSpendCurrentMonth: number;
  monthlyBudgetCap: number;
  projectedSpendMonthEnd: number;
  semanticCacheSavings: number;
  contextPruningSavings: number;
  slmOffloadingSavings: number;
  costByAgent: CostByAgent[];
  costByModel: CostByModel[];
  circuitBreakerActive: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerAction: 'drop_to_slm' | 'halt_non_critical' | 'reject_all';
}
