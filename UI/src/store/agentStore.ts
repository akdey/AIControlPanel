import { create } from 'zustand';
import type { AgentItem } from '../types/agents';

interface AgentState {
  agents: AgentItem[];
  selectedAgentId: string | null;
  drawerOpen: boolean;

  // Actions
  selectAgent: (id: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  updateAgentPolicy: (agentId: string, updatedProfile: Partial<AgentItem['policyProfile']>) => void;
  updateAgentStatus: (agentId: string, status: AgentItem['status']) => void;
}

const mockAgents: AgentItem[] = [
  {
    id: 'agent_support_bot_v2',
    name: 'Support Automation Tier-1',
    role: 'support_tier_1',
    associatedPipeline: 'Strict Financial Compliance',
    pipelineId: 'pipe_compliance_v1',
    monthlySpend: 420.50,
    monthlyLimit: 1000.00,
    status: 'active',
    totalInvocations24h: 18450,
    blockedIncidents24h: 32,
    policyProfile: {
      allowedTools: ['knowledge_base_search', 'ticket_create', 'faq_lookup'],
      blockedTools: ['database_drop', 'shell_exec', 'user_password_reset'],
      tpmLimit: 120000,
      rpmLimit: 600,
      mtlsFingerprint: 'sha256:8f:92:a1:03:d4:e7:81:c9',
      delegationTokenValidUntil: '2026-12-31T23:59:59Z',
    },
  },
  {
    id: 'agent_wealth_advisor',
    name: 'Wealth Advisor Assistant',
    role: 'financial_advisor',
    associatedPipeline: 'Wealth Management Permissive',
    pipelineId: 'pipe_wealth_v2',
    monthlySpend: 1890.10,
    monthlyLimit: 2500.00,
    status: 'active',
    totalInvocations24h: 4210,
    blockedIncidents24h: 3,
    policyProfile: {
      allowedTools: ['portfolio_rebalance', 'market_data_api', 'tax_estimator'],
      blockedTools: ['fund_transfer_external'],
      tpmLimit: 250000,
      rpmLimit: 1200,
      mtlsFingerprint: 'sha256:1a:4b:9c:8d:7e:6f:5a:4b',
      delegationTokenValidUntil: '2027-06-30T23:59:59Z',
    },
  },
  {
    id: 'agent_claims_processor',
    name: 'Automated Claims Evaluator',
    role: 'claims_auditor',
    associatedPipeline: 'Insurance Sandbox Policy',
    pipelineId: 'pipe_insurance_v1',
    monthlySpend: 820.00,
    monthlyLimit: 800.00,
    status: 'rate_limited',
    totalInvocations24h: 9120,
    blockedIncidents24h: 145,
    policyProfile: {
      allowedTools: ['policy_document_reader', 'claim_payout_calculator'],
      blockedTools: ['override_fraud_flag'],
      tpmLimit: 80000,
      rpmLimit: 300,
      mtlsFingerprint: 'sha256:5c:2d:8e:1f:4a:3b:2c:1d',
      delegationTokenValidUntil: '2026-09-30T23:59:59Z',
    },
  },
];

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: mockAgents,
  selectedAgentId: 'agent_support_bot_v2',
  drawerOpen: false,

  selectAgent: (id) => set({ selectedAgentId: id, drawerOpen: !!id }),
  setDrawerOpen: (open) => set({ drawerOpen: open }),

  updateAgentPolicy: (agentId, updatedProfile) => {
    set({
      agents: get().agents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              policyProfile: { ...agent.policyProfile, ...updatedProfile },
            }
          : agent
      ),
    });
  },

  updateAgentStatus: (agentId, status) => {
    set({
      agents: get().agents.map((agent) => (agent.id === agentId ? { ...agent, status } : agent)),
    });
  },
}));
