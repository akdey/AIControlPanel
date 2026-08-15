import { create } from 'zustand';
import type { FinOpsData } from '../types/finops';

interface FinOpsState {
  data: FinOpsData;
  projectedQueryGrowthPercent: number;
  
  // Actions
  setProjectedGrowth: (percent: number) => void;
  toggleCircuitBreaker: () => void;
  setCircuitBreakerThreshold: (threshold: number) => void;
  setCircuitBreakerAction: (action: FinOpsData['circuitBreakerAction']) => void;
}

const initialFinOpsData: FinOpsData = {
  totalSpendCurrentMonth: 3130.60,
  monthlyBudgetCap: 5000.00,
  projectedSpendMonthEnd: 4620.00,
  semanticCacheSavings: 1840.50,
  contextPruningSavings: 920.25,
  slmOffloadingSavings: 1450.00,
  costByAgent: [
    { agentId: 'agent_wealth_advisor', agentName: 'Wealth Advisor Assistant', spend: 1890.10, percentage: 60.3 },
    { agentId: 'agent_claims_processor', agentName: 'Automated Claims Evaluator', spend: 820.00, percentage: 26.2 },
    { agentId: 'agent_support_bot_v2', agentName: 'Support Automation Tier-1', spend: 420.50, percentage: 13.5 },
  ],
  costByModel: [
    { modelName: 'claude-3-5-sonnet', tokens: 18450000, cost: 1890.10, percentage: 60.3 },
    { modelName: 'gpt-4o', tokens: 8200000, cost: 820.00, percentage: 26.2 },
    { modelName: 'gpt-4o-mini (SLM)', tokens: 14200000, cost: 420.50, percentage: 13.5 },
  ],
  circuitBreakerActive: true,
  circuitBreakerThreshold: 4800.00,
  circuitBreakerAction: 'drop_to_slm',
};

export const useFinOpsStore = create<FinOpsState>((set, get) => ({
  data: initialFinOpsData,
  projectedQueryGrowthPercent: 30,

  setProjectedGrowth: (percent) => set({ projectedQueryGrowthPercent: percent }),
  
  toggleCircuitBreaker: () =>
    set({
      data: {
        ...get().data,
        circuitBreakerActive: !get().data.circuitBreakerActive,
      },
    }),

  setCircuitBreakerThreshold: (threshold) =>
    set({
      data: {
        ...get().data,
        circuitBreakerThreshold: threshold,
      },
    }),

  setCircuitBreakerAction: (action) =>
    set({
      data: {
        ...get().data,
        circuitBreakerAction: action,
      },
    }),
}));
