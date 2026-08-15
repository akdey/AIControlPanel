import type { ControlDefinition, ControlPort, PortDataType } from './controls';

export interface CustomNodeData extends Record<string, unknown> {
  controlId: string;
  control: ControlDefinition;
  configValues: Record<string, any>;
  dynamicPorts?: ControlPort[];
  status?: 'idle' | 'running' | 'passed' | 'blocked' | 'error';
  lastRunMetrics?: {
    latencyMs?: number;
    mutationSummary?: string;
    evaluatedToxicity?: number;
    decisionBranch?: string;
  };
}

export interface IngestionNodeData extends Record<string, unknown> {
  label: string;
  hookUrl: string;
  activeEnvironment: string;
  ports: ControlPort[];
}

export interface TerminalNodeData extends Record<string, unknown> {
  label: string;
  actionType: 'allow_llm' | 'halt_execution' | 'fallback_route' | 'trigger_alert';
  description: string;
  ports: ControlPort[];
}

export interface NodePortConnection {
  nodeId: string;
  handleId: string;
  handleType: 'source' | 'target';
  dataType: PortDataType;
}
