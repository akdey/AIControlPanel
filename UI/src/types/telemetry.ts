export interface SpanItem {
  id: string;
  traceId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'passed' | 'blocked' | 'halted' | 'mutated' | 'cached';
  inputPayload: any;
  outputPayload: any;
  mutatedFields?: string[];
  taintFlags?: string[];
  tokenCost?: number;
  errorDetails?: string;
}

export interface TraceItem {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  projectName: string;
  totalDurationMs: number;
  status: 'passed' | 'blocked' | 'halted';
  interceptedControl?: string;
  triggerReason?: string;
  actionTaken?: 'Halt' | 'Redact' | 'Route Fallback' | 'Alert';
  spans: SpanItem[];
  ingestedPayload: any;
  finalPayload: any;
  modelUsed: string;
  totalTokens: number;
  estimatedCost: number;
}
