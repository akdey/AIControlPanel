import { create } from 'zustand';
import { type Node, type Edge, type Connection, type NodeChange, type EdgeChange, addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { ControlDefinition, ControlPort } from '../types/controls';
import type { CustomNodeData } from '../types/canvas';
import { isValidConnection } from '../helpers/isValidConnection';
import { projectsApi } from '../api/services/projectsApi';

interface NodeSelectorPos {
  x: number;
  y: number;
  sourceNodeId?: string;
  sourcePortId?: string;
  sourcePortType?: string;
}

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  activePipelineId: string | null;
  activeProjectId: string | null;
  activeAgentName: string | null;
  isCanvasLoading: boolean;

  dryRunRunning: boolean;
  dryRunResults: Record<string, any> | null;
  connectionError: string | null;
  
  nodeSelectorPos: NodeSelectorPos | null;
  setNodeSelectorPos: (pos: NodeSelectorPos | null) => void;

  // Actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (id: string | null) => void;
  addControlNode: (control: ControlDefinition, position: { x: number; y: number }, sourceConnection?: { sourceNodeId: string, sourcePortId: string }) => void;
  updateNodeConfig: (nodeId: string, newConfigValues: Record<string, any>, dynamicPorts?: ControlPort[]) => void;
  deleteEdge: (edgeId: string) => void;
  addTerminalNode: (actionType: 'allow_llm' | 'block_llm', position: { x: number; y: number }, sourceConnection?: { sourceNodeId: string, sourcePortId: string }) => void;
  deleteNode: (nodeId: string) => void;
  runIsolationTest: (nodeId: string, samplePayload: Record<string, any>) => Promise<any>;
  clearConnectionError: () => void;
  resetGraph: () => void;
  loadPipelineCanvas: (pipelineId: string, projectId?: string, agentName?: string) => Promise<void>;
  savePipelineCanvas: (pipelineId?: string) => Promise<void>;
}

// Default graph: Start (System Prompt) and Stop (Allowed to LLM) start disconnected initially
const initialNodes: Node[] = [
  {
    id: 'node_prompt_start',
    type: 'prompt',
    position: { x: 50, y: 200 }, // Handle center Y = 200 + 62 = 262
    data: {
      label: 'System Prompt',
      ports: [
        { id: 'out_prompt_obj', label: 'Prompt Payload', type: 'prompt_object' },
      ],
    },
  },
  {
    id: 'node_term_allow',
    type: 'terminal',
    position: { x: 430, y: 194 }, // Handle center Y = 194 + 68 = 262
    data: {
      label: 'Allowed to LLM',
      actionType: 'allow_llm',
      description: 'Payload is clean & authorized. Forwarding to Model Execution.',
      ports: [{ id: 'in_term_pass', label: 'Sanitized Prompt', type: 'sanitized_prompt_object' }],
    },
  }
];

// Starts disconnected so user can connect or build pipeline
const initialEdges: Edge[] = [];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  dryRunRunning: false,
  dryRunResults: null,
  connectionError: null,
  
  nodeSelectorPos: null,
  setNodeSelectorPos: (pos) => set({ nodeSelectorPos: pos }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const check = isValidConnection(connection, get().nodes);
    if (!check.valid) {
      set({ connectionError: check.reason || 'Invalid connection' });
      return;
    }

    set({ connectionError: null });
    const edgeColor = check.sourceType ? '#3b82f6' : '#64748b';
    const newEdge: Edge = {
      ...connection,
      id: `e_${connection.source}_${connection.target}_${Date.now()}`,
      animated: true,
      style: { stroke: edgeColor, strokeWidth: 2 },
    } as Edge;

    set({ edges: addEdge(newEdge, get().edges) });
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  addControlNode: (control, position, sourceConnection) => {
    const newId = `node_${control.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Extract default form values
    const defaultConfigValues: Record<string, any> = {};
    control?.uiForm?.fields?.forEach((f) => {
      if (f.defaultValue !== undefined) {
        defaultConfigValues[f.name] = f.defaultValue;
      }
    });

    const dynamicPorts = control.ports.dynamicOutputs
      ? [
          { id: 'port_critical', label: 'Critical Violation (> 0.90)', type: 'alert_signal' as const },
          { id: 'port_pass', label: 'Clean / Allowed (<= 0.90)', type: 'sanitized_prompt_object' as const },
        ]
      : undefined;

    let finalPosition = { ...position };
    const nodeWidth = 288;
    const rightConstant = 38;
    const leftConstant = 14;
    const wireGap = 40;
    const deltaX = nodeWidth + rightConstant + leftConstant + wireGap; // 380px

    // Calculate position FIRST if sourceConnection is provided
    if (sourceConnection) {
      const sourceNode = get().nodes.find((n) => n.id === sourceConnection.sourceNodeId);
      if (sourceNode) {
        const customData = sourceNode.data as unknown as CustomNodeData;
        const outputs = customData?.control?.ports?.outputs || (sourceNode.data as any)?.ports || [];
        const dynamicOutputs = customData?.dynamicPorts || [];
        const allOutputs = [...outputs, ...dynamicOutputs];
        
        const portIndex = Math.max(0, allOutputs.findIndex((p: any) => p.id === sourceConnection.sourcePortId));
        
        // Calculate exact Y offset of the specific source port handle dot
        let sourcePortYOffset = 90;
        if (sourceNode.type === 'prompt') {
          sourcePortYOffset = 62;
        } else if (sourceNode.type === 'terminal') {
          sourcePortYOffset = 68;
        } else if (allOutputs.length > 1) {
          // Multi-output control node: handles are at ((idx + 1) / (len + 1)) * 180px
          sourcePortYOffset = ((portIndex + 1) / (allOutputs.length + 1)) * 180;
        }

        const targetCenterOffset = 90; // new controlNode input handle center offset from top
        const sourcePosY = sourceNode.position?.y ?? position.y ?? 200;
        const sourcePosX = sourceNode.position?.x ?? position.x ?? 100;
        const sourceHandleY = sourcePosY + sourcePortYOffset;
        const alignedTargetY = sourceHandleY - targetCenterOffset;

        finalPosition = {
          x: sourcePosX + deltaX,
          y: alignedTargetY,
        };
      }
    }

    const newNode: Node = {
      id: newId,
      type: 'controlNode',
      position: finalPosition,
      data: {
        controlId: control.id,
        control,
        configValues: defaultConfigValues,
        dynamicPorts,
        status: 'idle',
      } satisfies CustomNodeData,
    };

    // Auto-shift existing downstream nodes rightward so they make room for the new node
    const newX = finalPosition.x;
    const baseNodes = sourceConnection
      ? get().nodes.map((node) => {
          const nodeX = node.position?.x ?? 0;
          if (node.id !== sourceConnection.sourceNodeId && nodeX >= newX - 80) {
            return {
              ...node,
              position: {
                ...(node.position || { y: 200 }),
                x: nodeX + deltaX,
              },
            };
          }
          return node;
        })
      : get().nodes;

    const newNodes = [...baseNodes, newNode];
    let newEdges = get().edges;

    if (sourceConnection) {
      const targetHandle = control?.ports?.inputs?.[0]?.id;
      if (targetHandle) {
        const edgeColor = '#3b82f6';
        const newEdge: Edge = {
          id: `e_${sourceConnection.sourceNodeId}_${newId}_${Date.now()}`,
          source: sourceConnection.sourceNodeId,
          sourceHandle: sourceConnection.sourcePortId,
          target: newId,
          targetHandle: targetHandle,
          animated: true,
          style: { stroke: edgeColor, strokeWidth: 2 },
        };
        newEdges = addEdge(newEdge, newEdges);
      }
    }

    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: newId,
      nodeSelectorPos: null // Close the selector
    });
  },

  updateNodeConfig: (nodeId, newConfigValues, dynamicPorts) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          const currentData = node.data as unknown as CustomNodeData;
          return {
            ...node,
            data: {
              ...currentData,
              configValues: { ...currentData.configValues, ...newConfigValues },
              dynamicPorts: dynamicPorts || currentData.dynamicPorts,
            },
          };
        }
        return node;
      }),
    });
  },

  deleteEdge: (edgeId) =>
    set({
      edges: get().edges.filter((e) => e.id !== edgeId),
    }),

  addTerminalNode: (actionType, position, sourceConnection) => {
    const isAllow = actionType === 'allow_llm';
    const newId = `node_term_${isAllow ? 'allow' : 'block'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let finalPosition = { ...position };

    if (sourceConnection) {
      const sourceNode = get().nodes.find((n) => n.id === sourceConnection.sourceNodeId);
      if (sourceNode) {
        const deltaX = 380;
        const sourceCenterOffset = sourceNode.type === 'prompt' ? 62 : sourceNode.type === 'terminal' ? 68 : 90;
        const targetCenterOffset = 68; // TerminalNode handle center offset
        const sourcePosY = sourceNode.position?.y ?? position.y ?? 200;
        const sourcePosX = sourceNode.position?.x ?? position.x ?? 100;
        const sourceHandleY = sourcePosY + sourceCenterOffset;
        finalPosition = {
          x: sourcePosX + deltaX,
          y: sourceHandleY - targetCenterOffset,
        };
      }
    }

    const newNode: Node = {
      id: newId,
      type: 'terminal',
      position: finalPosition,
      data: {
        label: isAllow ? 'Allowed to LLM' : 'Blocked / Security Violation',
        actionType,
        description: isAllow
          ? 'Payload is clean & authorized. Forwarding to Model Execution.'
          : 'Payload contains security violation or prompt injection. Execution halted and blocked from LLM.',
        ports: [
          {
            id: isAllow ? 'in_term_pass' : 'in_term_block',
            label: isAllow ? 'Sanitized Prompt' : 'Blocked / Halt Signal',
            type: isAllow ? 'sanitized_prompt_object' : 'halt_signal',
          },
        ],
      },
    };

    const newNodes = [...get().nodes, newNode];
    let newEdges = get().edges;

    if (sourceConnection) {
      const newEdge: Edge = {
        id: `e_${sourceConnection.sourceNodeId}_${newId}_${Date.now()}`,
        source: sourceConnection.sourceNodeId,
        sourceHandle: sourceConnection.sourcePortId,
        target: newId,
        targetHandle: isAllow ? 'in_term_pass' : 'in_term_block',
        animated: true,
        style: { stroke: isAllow ? '#10b981' : '#f43f5e', strokeWidth: 2 },
      };
      newEdges = addEdge(newEdge, newEdges);
    }

    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: newId,
      nodeSelectorPos: null,
    });
  },

  deleteNode: (nodeId) => {
    if (nodeId.includes('start')) return; // Cannot delete start node
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  runIsolationTest: async (nodeId, samplePayload) => {
    set({ dryRunRunning: true, dryRunResults: null });
    await new Promise((res) => setTimeout(res, 600));

    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node) {
      set({ dryRunRunning: false });
      return null;
    }

    const data = node.data as unknown as CustomNodeData;
    const result = {
      timestamp: new Date().toISOString(),
      nodeId,
      controlName: data.control.name,
      engine: data.control.runtimeConfig.engine,
      status: 'PASSED',
      latencyMs: Math.floor(Math.random() * 25) + 5,
      evaluatedPayload: {
        ...samplePayload,
        _governanceMeta: {
          evaluatedBy: data.control.name,
          maskingApplied: data.controlId === 'ctrl_pii_masking',
          toxicityScore: 0.02,
          policyDecision: 'ALLOW',
        },
      },
    };

    set({ dryRunRunning: false, dryRunResults: result });
    return result;
  },

  activePipelineId: null,
  activeProjectId: null,
  activeAgentName: null,
  isCanvasLoading: false,

  clearConnectionError: () => set({ connectionError: null }),

  resetGraph: () => set({ nodes: initialNodes, edges: initialEdges, nodeSelectorPos: null }),

  loadPipelineCanvas: async (pipelineId: string, projectId?: string, agentName?: string) => {
    set({
      isCanvasLoading: true,
      activePipelineId: pipelineId,
      activeProjectId: projectId || null,
      activeAgentName: agentName || null,
    });
    try {
      const data = await projectsApi.getCanvas(pipelineId);
      if (data && data.canvas_json && Array.isArray(data.canvas_json.nodes) && data.canvas_json.nodes.length > 0) {
        const sanitizedNodes = data.canvas_json.nodes.map((node: any, idx: number) => ({
          ...node,
          position: (node && node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number')
            ? node.position
            : { x: 50 + idx * 320, y: 200 },
        }));
        set({
          nodes: sanitizedNodes,
          edges: data.canvas_json.edges || [],
          activeProjectId: data.project_id || projectId || null,
          activeAgentName: agentName || data.name || null,
          isCanvasLoading: false,
        });
        return;
      }
    } catch (err) {
      console.warn(`[CanvasStore] No saved canvas found for pipeline '${pipelineId}'. Loading default initial canvas:`, err);
    }
    set({
      nodes: initialNodes,
      edges: initialEdges,
      activePipelineId: pipelineId,
      activeProjectId: projectId || null,
      activeAgentName: agentName || null,
      isCanvasLoading: false,
    });
  },

  savePipelineCanvas: async (pipelineId?: string) => {
    const targetPipelineId = pipelineId || get().activePipelineId || 'pipe_001';
    const targetProjectId = get().activeProjectId || 'proj_default';
    const targetAgentName = get().activeAgentName || 'Control Pipeline DAG';
    const { nodes, edges } = get();

    await projectsApi.saveAgentPipeline(
      targetPipelineId,
      nodes,
      edges,
      targetProjectId,
      `${targetAgentName} Pipeline`
    );
  },
}));
