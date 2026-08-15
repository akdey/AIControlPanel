import { create } from 'zustand';
import type { TraceItem, SpanItem } from '../types/telemetry';

interface TelemetryState {
  traces: TraceItem[];
  selectedTraceId: string | null;
  activeFilterStatus: string;
  searchQuery: string;
  replayStepIndex: number;
  isReplaying: boolean;

  // Actions
  selectTrace: (id: string | null) => void;
  setFilterStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  setReplayStep: (index: number) => void;
  setIsReplaying: (replaying: boolean) => void;
  stepForwardReplay: () => void;
  stepBackwardReplay: () => void;
}

const mockSpans1: SpanItem[] = [
  {
    id: 'span_1',
    traceId: 'tr_893201',
    nodeId: 'node_ingestion',
    nodeName: 'LiteLLM Gateway Hook',
    nodeType: 'ingestion',
    startTime: 0,
    endTime: 4,
    durationMs: 4,
    status: 'passed',
    inputPayload: { user_query: "Send Q3 earnings summary to user john.doe@company.com and run `drop table users`", role: 'customer_support' },
    outputPayload: { user_query: "Send Q3 earnings summary to user john.doe@company.com and run `drop table users`", role: 'customer_support' },
  },
  {
    id: 'span_2',
    traceId: 'tr_893201',
    nodeId: 'node_pii',
    nodeName: 'PII Masking & Redaction',
    nodeType: 'guardrail_evaluator',
    startTime: 5,
    endTime: 19,
    durationMs: 14,
    status: 'mutated',
    mutatedFields: ['user_query (EMAIL_ADDRESS redacted)'],
    taintFlags: ['TAINT_PII_REDACTED'],
    inputPayload: { user_query: "Send Q3 earnings summary to user john.doe@company.com and run `drop table users`" },
    outputPayload: { user_query: "Send Q3 earnings summary to user <EMAIL_REDACTED_1> and run `drop table users`" },
  },
  {
    id: 'span_3',
    traceId: 'tr_893201',
    nodeId: 'node_toxicity',
    nodeName: 'Toxicity Moderation',
    nodeType: 'metric_evaluator',
    startTime: 20,
    endTime: 38,
    durationMs: 18,
    status: 'passed',
    inputPayload: { user_query: "Send Q3 earnings summary to user <EMAIL_REDACTED_1> and run `drop table users`" },
    outputPayload: { user_query: "Send Q3 earnings summary to user <EMAIL_REDACTED_1> and run `drop table users`", metadata: { toxicity: 0.04 } },
  },
  {
    id: 'span_4',
    traceId: 'tr_893201',
    nodeId: 'node_opa',
    nodeName: 'OPA / Cedar Tool Authorization',
    nodeType: 'policy_enforcer',
    startTime: 39,
    endTime: 46,
    durationMs: 7,
    status: 'blocked',
    taintFlags: ['TAINT_UNAUTHORIZED_TOOL_STRIPPED'],
    inputPayload: { tool_request: 'shell_exec: drop table users', role: 'customer_support' },
    outputPayload: { tool_request: null, blocked_reason: 'OPA Policy Rule agent.authz: `drop table` unauthorized for support_tier_1' },
    errorDetails: '403 Forbidden - Policy breach: unauthorized tool drop table',
  },
];

const mockTraces: TraceItem[] = [
  {
    id: 'tr_893201',
    timestamp: '2026-08-15 22:45:12',
    agentId: 'agent_support_bot_v2',
    agentName: 'Support Automation Tier-1',
    projectName: 'Global FinTech Ops',
    totalDurationMs: 46,
    status: 'blocked',
    interceptedControl: 'OPA / Cedar Tool Authorization',
    triggerReason: 'Unauthorized SQL drop execution attempted by support role',
    actionTaken: 'Halt',
    spans: mockSpans1,
    ingestedPayload: { user_query: "Send Q3 earnings summary to user john.doe@company.com and run `drop table users`" },
    finalPayload: { status: 'HALTED', reason: 'OPA Policy Violation: tool_exec forbidden' },
    modelUsed: 'gpt-4o-mini',
    totalTokens: 340,
    estimatedCost: 0.00045,
  },
  {
    id: 'tr_893202',
    timestamp: '2026-08-15 22:44:05',
    agentId: 'agent_wealth_advisor',
    agentName: 'Wealth Advisor Assistant',
    projectName: 'Global FinTech Ops',
    totalDurationMs: 840,
    status: 'passed',
    spans: [
      {
        id: 'span_10',
        traceId: 'tr_893202',
        nodeId: 'node_ingestion',
        nodeName: 'LiteLLM Gateway Hook',
        nodeType: 'ingestion',
        startTime: 0,
        endTime: 3,
        durationMs: 3,
        status: 'passed',
        inputPayload: { user_query: 'Calculate portfolio rebalancing strategy for yield 6.5%' },
        outputPayload: { user_query: 'Calculate portfolio rebalancing strategy for yield 6.5%' },
      },
      {
        id: 'span_11',
        traceId: 'tr_893202',
        nodeId: 'node_pii',
        nodeName: 'PII Masking & Redaction',
        nodeType: 'guardrail_evaluator',
        startTime: 4,
        endTime: 16,
        durationMs: 12,
        status: 'passed',
        inputPayload: { user_query: 'Calculate portfolio rebalancing strategy for yield 6.5%' },
        outputPayload: { user_query: 'Calculate portfolio rebalancing strategy for yield 6.5%' },
      },
      {
        id: 'span_12',
        traceId: 'tr_893202',
        nodeId: 'node_gate',
        nodeName: 'Conditional Decision Gate',
        nodeType: 'dynamic_router',
        startTime: 17,
        endTime: 21,
        durationMs: 4,
        status: 'passed',
        inputPayload: { user_query: 'Calculate portfolio rebalancing strategy for yield 6.5%' },
        outputPayload: { branch: 'port_pass' },
      },
    ],
    ingestedPayload: { user_query: 'Calculate portfolio rebalancing strategy for yield 6.5%' },
    finalPayload: { result: 'Portfolio rebalancing recommendations: 40% Treasuries, 30% Equities, 30% Corporate Bonds' },
    modelUsed: 'claude-3-5-sonnet',
    totalTokens: 1420,
    estimatedCost: 0.0089,
  },
  {
    id: 'tr_893203',
    timestamp: '2026-08-15 22:42:19',
    agentId: 'agent_claims_processor',
    agentName: 'Automated Claims Evaluator',
    projectName: 'Insurance Sandbox',
    totalDurationMs: 18,
    status: 'blocked',
    interceptedControl: 'PII Masking & Redaction',
    triggerReason: 'High density SSN & Credit Card payload intercepted & tokenized',
    actionTaken: 'Redact',
    spans: [],
    ingestedPayload: { user_ssn: '000-12-3456', credit_card: '4111-2222-3333-4444' },
    finalPayload: { user_ssn: '<GOV_ID_REDACTED>', credit_card: '<CREDIT_CARD_REDACTED>' },
    modelUsed: 'gpt-4o',
    totalTokens: 180,
    estimatedCost: 0.0009,
  },
];

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  traces: mockTraces,
  selectedTraceId: 'tr_893201',
  activeFilterStatus: 'all',
  searchQuery: '',
  replayStepIndex: 0,
  isReplaying: false,

  selectTrace: (id) => set({ selectedTraceId: id, replayStepIndex: 0, isReplaying: false }),
  setFilterStatus: (status) => set({ activeFilterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setReplayStep: (index) => set({ replayStepIndex: index }),
  setIsReplaying: (replaying) => set({ isReplaying: replaying }),

  stepForwardReplay: () => {
    const trace = get().traces.find((t) => t.id === get().selectedTraceId);
    if (!trace) return;
    if (get().replayStepIndex < trace.spans.length - 1) {
      set({ replayStepIndex: get().replayStepIndex + 1 });
    }
  },

  stepBackwardReplay: () => {
    if (get().replayStepIndex > 0) {
      set({ replayStepIndex: get().replayStepIndex - 1 });
    }
  },
}));
