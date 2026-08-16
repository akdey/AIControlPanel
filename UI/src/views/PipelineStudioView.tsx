import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '../store/canvasStore';
import { GenericControlNode } from '../components/canvas/GenericControlNode';
import { PromptNode, TerminalNode } from '../components/canvas/PromptNode';
import { NodeInspectorDrawer } from '../components/canvas/NodeInspectorDrawer';
import { NodePaletteDrawer } from '../components/canvas/NodePaletteDrawer';
import { useThemeStore } from '../store/themeStore';
import {
  GitFork,
  Save,
  RotateCcw,
  Maximize2,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';

import { validateGraphCompleteness } from '../helpers/isValidConnection';
import { DeletableEdge } from '../components/canvas/DeletableEdge';

const nodeTypes: NodeTypes = {
  controlNode: GenericControlNode as any,
  prompt: PromptNode as any,
  terminal: TerminalNode as any,
};

const edgeTypes = {
  default: DeletableEdge,
};

export interface PipelineStudioViewProps {
  agentId?: string;
  agentName?: string;
  projectId?: string;
}

const PipelineCanvasContent: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    connectionError,
    clearConnectionError,
    resetGraph,
    setNodeSelectorPos,
    deleteEdge,
    activePipelineId,
    activeAgentName,
    isCanvasLoading,
    savePipelineCanvas
  } = useCanvasStore();

  const [isDisintegrating, setIsDisintegrating] = useState(false);

  useEffect(() => {
    if (!connectionError) {
      setIsDisintegrating(false);
      return;
    }

    setIsDisintegrating(false);

    // Auto-dismiss timer: start smooth fade-out after 3.0 seconds
    const snapTimer = setTimeout(() => {
      setIsDisintegrating(true);
    }, 3000);

    // Clear connection error state after fade transition completes (3.55s)
    const clearTimer = setTimeout(() => {
      clearConnectionError();
      setIsDisintegrating(false);
    }, 3550);

    return () => {
      clearTimeout(snapTimer);
      clearTimeout(clearTimer);
    };
  }, [connectionError, clearConnectionError]);

  const handleManualDismiss = () => {
    setIsDisintegrating(true);
    setTimeout(() => {
      clearConnectionError();
      setIsDisintegrating(false);
    }, 700);
  };

  const handleSaveDAG = async () => {
    try {
      const targetId = activePipelineId || 'pipe_001';
      await savePipelineCanvas(targetId);
      alert(`Pipeline DAG Saved Successfully to Control Plane Backend for ${activeAgentName ? `'${activeAgentName}'` : 'agent'}!`);
    } catch (err) {
      console.error('Failed to save DAG:', err);
      alert('Failed to save DAG to backend server.');
    }
  };

  const theme = useThemeStore((s) => s.theme);
  const connectingHandle = useRef<{ nodeId: string; handleId: string | null; handleType: string | null } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();

  const graphValidation = validateGraphCompleteness(nodes, edges);

  const onConnectStart = useCallback((_: any, { nodeId, handleId, handleType }: any) => {
    connectingHandle.current = { nodeId, handleId, handleType };
  }, []);

  const onConnectEnd = useCallback(
    (event: any, connectionState: any) => {
      if (!connectingHandle.current) return;

      const isValid = connectionState?.isValid;
      const targetIsNode = (event.target as HTMLElement)?.closest?.('.react-flow__node');

      if (!isValid && !targetIsNode) {
        const clientX = event.clientX || event.touches?.[0]?.clientX || 300;
        const clientY = event.clientY || event.touches?.[0]?.clientY || 200;

        const flowPos = screenToFlowPosition ? screenToFlowPosition({ x: clientX, y: clientY }) : { x: clientX, y: clientY };

        setNodeSelectorPos({
          x: flowPos.x,
          y: flowPos.y,
          sourceNodeId: connectingHandle.current.nodeId,
          sourcePortId: connectingHandle.current.handleId || undefined,
          sourcePortType: connectingHandle.current.handleType || undefined,
        });
      }

      connectingHandle.current = null;
    },
    [setNodeSelectorPos, screenToFlowPosition]
  );

  return (
    <div className="flex flex-1 h-full w-full app-bg overflow-hidden relative">
      {/* Main Canvas Area */}
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        {/* Top Floating Control Bar */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 app-surface border app-border backdrop-blur-xl px-3 py-1.5 rounded-xl shadow-xl">
          {/* Title & Status Badge */}
          <div className="flex items-center gap-3 pr-3 border-r app-border">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-xs">
              <GitFork className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold app-text-main">
                {activeAgentName ? `${activeAgentName} Pipeline` : 'Agent Pipeline Studio'}
              </h2>

              {isCanvasLoading ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading Pipeline...</span>
                </div>
              ) : graphValidation.isValid ? (
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                  title="Pipeline fully connected and valid"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                  <span>Valid Pipeline</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-xs cursor-help"
                  title={`Graph Incomplete: ${graphValidation.reason}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b] animate-pulse" />
                  <span>Draft / Unconnected</span>
                </div>
              )}
            </div>
          </div>

          {/* Control Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Fit View Button */}
            <button
              onClick={() => fitView({ padding: 0.2, duration: 400 })}
              className="app-surface hover:bg-slate-200 dark:hover:bg-slate-800 app-text-main text-[11px] font-medium px-2.5 py-1 rounded-lg border app-border flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Center and fit canvas view"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> Fit View
            </button>

            {/* Save DAG Button */}
            <button
              onClick={handleSaveDAG}
              disabled={!graphValidation.isValid || isCanvasLoading}
              className={
                graphValidation.isValid && !isCanvasLoading
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95'
                  : 'bg-slate-800/80 text-slate-500 text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-not-allowed border border-slate-800 opacity-60'
              }
              title={graphValidation.isValid ? 'Save DAG Configuration Live' : `Cannot Save: ${graphValidation.reason}`}
            >
              <Save className="w-3.5 h-3.5" /> Save DAG
            </button>

            {/* Reset Graph Button */}
            <button
              onClick={resetGraph}
              className="app-surface hover:bg-rose-950/30 hover:border-rose-500/50 text-slate-300 hover:text-rose-400 text-[11px] font-medium px-2.5 py-1 rounded-lg border app-border flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset canvas to default state"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
        </div>

        {/* Connection Type Mismatch Error Toast */}
        {connectionError && (
          <div
            className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 transition-all duration-500 ease-out ${
              isDisintegrating
                ? 'opacity-0 scale-95 -translate-y-3 blur-xs pointer-events-none'
                : 'opacity-100 scale-100 blur-none translate-y-0 animate-in fade-in zoom-in-95 duration-300 animate-bounce'
            }`}
          >
            <div className="bg-rose-950/90 text-rose-200 border border-rose-500/40 shadow-xl px-4 py-3 rounded-xl backdrop-blur-xl flex items-start gap-3 relative overflow-hidden">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex-1 text-xs">
                <h4 className="font-bold text-rose-300 mb-0.5">Connection Rejected (Type Mismatch)</h4>
                <p className="text-slate-300 text-[11px] leading-relaxed">{connectionError}</p>
              </div>
              <button
                onClick={handleManualDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Node Palette Quick Add Drawer */}
        <NodePaletteDrawer />

        {/* ReactFlow Canvas Viewport */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeClick={(_, node) => selectNode(node.id)}
          onPaneClick={() => { selectNode(null); setNodeSelectorPos(null); }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode={theme === 'dark' || theme === 'midnight' ? 'dark' : 'light'}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2, stroke: '#3b82f6' },
          }}
        >
          <Background gap={20} size={1} />
          <Controls className="!app-surface !app-border !app-text-main" />
          <MiniMap
            className="!app-surface !app-border rounded-lg overflow-hidden"
            nodeColor={(node) => {
              if (node.type === 'prompt') return '#3b82f6';
              if (node.type === 'terminal') return '#10b981';
              return '#06b6d4';
            }}
          />
        </ReactFlow>
      </div>

      {/* Right Drawer Inspector */}
      <NodeInspectorDrawer />
    </div>
  );
};

export const PipelineStudioView: React.FC<PipelineStudioViewProps> = ({ agentId, agentName, projectId }) => {
  const loadPipelineCanvas = useCanvasStore((s) => s.loadPipelineCanvas);

  useEffect(() => {
    const targetPipelineId = agentId || 'pipe_001';
    loadPipelineCanvas(targetPipelineId, projectId, agentName);
  }, [agentId, agentName, projectId, loadPipelineCanvas]);

  return (
    <ReactFlowProvider>
      <div className="w-full h-full flex flex-col flex-1 min-h-[calc(100vh-130px)] relative overflow-hidden">
        <PipelineCanvasContent />
      </div>
    </ReactFlowProvider>
  );
};
