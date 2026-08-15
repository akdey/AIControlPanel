import type { Node, Connection } from '@xyflow/react';
import type { PortDataType } from '../types/controls';
import type { CustomNodeData, IngestionNodeData, TerminalNodeData } from '../types/canvas';

export interface PortTypeInfo {
  label: string;
  color: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

export const PORT_TYPE_METADATA: Record<PortDataType, PortTypeInfo> = {
  prompt_object: {
    label: 'Prompt Object',
    color: '#3b82f6', // blue-500
    badgeBg: 'bg-blue-950/80',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
  },
  raw_text: {
    label: 'Raw Text',
    color: '#06b6d4', // cyan-500
    badgeBg: 'bg-cyan-950/80',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500',
  },
  tool_payload: {
    label: 'Tool Payload',
    color: '#8b5cf6', // purple-500
    badgeBg: 'bg-purple-950/80',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500',
  },
  sanitized_prompt_object: {
    label: 'Sanitized Prompt',
    color: '#10b981', // emerald-500
    badgeBg: 'bg-emerald-950/80',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
  },
  redaction_metadata: {
    label: 'Redaction Meta',
    color: '#f59e0b', // amber-500
    badgeBg: 'bg-amber-950/80',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500',
  },
  scored_payload: {
    label: 'Scored Context',
    color: '#ec4899', // pink-500
    badgeBg: 'bg-pink-950/80',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500',
  },
  tool_manifest: {
    label: 'Tool Manifest',
    color: '#6366f1', // indigo-500
    badgeBg: 'bg-indigo-950/80',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500',
  },
  filtered_tool_manifest: {
    label: 'Filtered Manifest',
    color: '#14b8a6', // teal-500
    badgeBg: 'bg-teal-950/80',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500',
  },
  sandbox_result: {
    label: 'Sandbox Result',
    color: '#84cc16', // lime-500
    badgeBg: 'bg-lime-950/80',
    textColor: 'text-lime-400',
    borderColor: 'border-lime-500',
  },
  halt_signal: {
    label: 'Halt Signal',
    color: '#ef4444', // red-500
    badgeBg: 'bg-red-950/80',
    textColor: 'text-red-400',
    borderColor: 'border-red-500',
  },
  alert_signal: {
    label: 'Alert Signal',
    color: '#f97316', // orange-500
    badgeBg: 'bg-orange-950/80',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500',
  },
  generic_context: {
    label: 'Generic Context',
    color: '#94a3b8', // slate-400
    badgeBg: 'bg-slate-900',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-400',
  },
  cache_hit_payload: {
    label: 'Cache Hit Return',
    color: '#22c55e', // green-500
    badgeBg: 'bg-green-950/80',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
  },
};

/**
 * Validates whether a proposed edge connection between a source port and target port is valid.
 * Checks compatibility between the output type of the source handle and allowed inputs of the target handle.
 */
export function isValidConnection(
  connection: Connection,
  nodes: Node[]
): { valid: boolean; reason?: string; sourceType?: PortDataType; targetType?: PortDataType } {
  if (!connection.source || !connection.target) {
    return { valid: false, reason: 'Missing source or target node' };
  }

  // Prevent connecting a node to itself
  if (connection.source === connection.target) {
    return { valid: false, reason: 'Cannot connect a node to itself' };
  }

  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) {
    return { valid: false, reason: 'Source or target node not found in graph' };
  }

  // Find source port data type
  let sourceType: PortDataType | undefined;
  if (sourceNode.type === 'ingestion') {
    const data = sourceNode.data as unknown as IngestionNodeData;
    const port = data.ports.find((p) => p.id === connection.sourceHandle);
    sourceType = port?.type || 'prompt_object';
  } else if (sourceNode.type === 'controlNode') {
    const data = sourceNode.data as unknown as CustomNodeData;
    const outputs = data.control.ports.outputs || [];
    const dynamicOutputs = data.dynamicPorts || [];
    const port = [...outputs, ...dynamicOutputs].find((p) => p.id === connection.sourceHandle);
    sourceType = port?.type;
  }

  // Find target allowed inputs
  let allowedTargetInputs: PortDataType[] = [];
  let targetNodeName = 'Target';
  if (targetNode.type === 'terminal') {
    const data = targetNode.data as unknown as TerminalNodeData;
    targetNodeName = data.label;
    const port = data.ports.find((p) => p.id === connection.targetHandle);
    if (port) {
      allowedTargetInputs = [port.type];
    } else {
      // Terminal accepts all prompt objects or signals
      allowedTargetInputs = ['prompt_object', 'sanitized_prompt_object', 'cache_hit_payload', 'halt_signal', 'alert_signal'];
    }
  } else if (targetNode.type === 'controlNode') {
    const data = targetNode.data as unknown as CustomNodeData;
    targetNodeName = data.control.name;
    const port = (data.control.ports.inputs || []).find((p) => p.id === connection.targetHandle);
    if (port) {
      allowedTargetInputs = [port.type];
    }
    // Also check control ioValidation allowedInputs
    const ioAllowed = data.control.ioValidation.allowedInputs || [];
    allowedTargetInputs = Array.from(new Set([...allowedTargetInputs, ...ioAllowed]));
  }

  if (!sourceType) {
    return { valid: false, reason: 'Could not determine output data type of source port' };
  }

  // Check type match or polymorphism
  const isCompatible =
    allowedTargetInputs.includes(sourceType) ||
    allowedTargetInputs.includes('generic_context') ||
    (sourceType === 'sanitized_prompt_object' && allowedTargetInputs.includes('prompt_object')) ||
    (sourceType === 'prompt_object' && allowedTargetInputs.includes('sanitized_prompt_object'));

  if (!isCompatible) {
    const sourceTypeName = PORT_TYPE_METADATA[sourceType]?.label || sourceType;
    const allowedNames = allowedTargetInputs.map((t) => PORT_TYPE_METADATA[t]?.label || t).join(', ');
    return {
      valid: false,
      reason: `Type Mismatch: Port outputs "${sourceTypeName}", but ${targetNodeName} expects [${allowedNames}]`,
      sourceType,
      targetType: allowedTargetInputs[0],
    };
  }

  return { valid: true, sourceType, targetType: sourceType };
}

/**
 * Validates whether the entire DAG graph is fully connected from Start node to Terminal nodes.
 * Disables saving if there are unconnected dangling control nodes or unhandled ports.
 */
export function validateGraphCompleteness(nodes: Node[], edges: Edge[]): { isValid: boolean; reason?: string } {
  if (nodes.length === 0) return { isValid: false, reason: 'Empty Canvas' };

  const startNodes = nodes.filter((n) => n.type === 'prompt');
  const terminalNodes = nodes.filter((n) => n.type === 'terminal');

  if (startNodes.length === 0) {
    return { isValid: false, reason: 'Missing Start Prompt Node' };
  }

  if (terminalNodes.length === 0) {
    return { isValid: false, reason: 'Missing Terminal Endpoint' };
  }

  // Check every start node has an outgoing connection
  for (const startNode of startNodes) {
    const hasOutgoing = edges.some((e) => e.source === startNode.id);
    if (!hasOutgoing) {
      return { isValid: false, reason: 'Start Node has no outgoing connection' };
    }
  }

  // Check every intermediate controlNode has at least 1 incoming and 1 outgoing connection
  for (const node of nodes) {
    if (node.type === 'controlNode') {
      const data = node.data as unknown as CustomNodeData;
      const nodeName = data?.control?.name || 'Control Node';

      const hasInputEdge = edges.some((e) => e.target === node.id);
      if (!hasInputEdge) {
        return { isValid: false, reason: `"${nodeName}" has unconnected input` };
      }

      const hasOutputEdge = edges.some((e) => e.source === node.id);
      if (!hasOutputEdge) {
        return { isValid: false, reason: `"${nodeName}" has unconnected output` };
      }
    }
  }

  // Check terminal nodes have incoming connections
  for (const termNode of terminalNodes) {
    const hasIncoming = edges.some((e) => e.target === termNode.id);
    if (!hasIncoming) {
      const label = (termNode.data as any)?.label || 'Terminal Endpoint';
      return { isValid: false, reason: `"${label}" has no incoming connection` };
    }
  }

  return { isValid: true };
}
