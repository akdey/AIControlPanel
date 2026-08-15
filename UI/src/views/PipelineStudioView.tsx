import React, { useRef, useCallback } from 'react';
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
  AlertTriangle,
  AlertCircle,
  X,
  Plus,
  Maximize2,
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
    deleteEdge
  } = useCanvasStore();

  const theme = useThemeStore((s) => s.theme);
  const connectingHandle = useRef<{ nodeId: string; handleId: string | null; handleType: string | null } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  const graphValidation = validateGraphCompleteness(nodes, edges);

  const onConnectStart = useCallback((_: any, { nodeId, handleId, handleType }: any) => {
    connectingHandle.current = { nodeId, handleId, handleType };
  }, []);

  const onConnectEnd = useCallback(
    (event: any) => {
      if (!connectingHandle.current) return;

      const targetIsPane = (event.target as HTMLElement)?.classList?.contains('react-flow__pane');

      if (targetIsPane && connectingHandle.current.handleType === 'source') {
        const clientX = event.clientX || event.touches?.[0]?.clientX;
        const clientY = event.clientY || event.touches?.[0]?.clientY;

        setNodeSelectorPos({
          x: clientX || 300,
          y: clientY || 200,
          sourceNodeId: connectingHandle.current.nodeId,
          sourcePortId: connectingHandle.current.handleId || undefined,
        });
      }

      connectingHandle.current = null;
    },
    [setNodeSelectorPos]
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
              <h2 className="text-xs font-bold app-text-main">Agent Pipeline Builder</h2>

              {graphValidation.isValid ? (
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
              onClick={() => alert('Pipeline DAG Saved Successfully!')}
              disabled={!graphValidation.isValid}
              className={
                graphValidation.isValid
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95'
                  : 'bg-slate-800/80 text-slate-500 text-[11px] font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-not-allowed border border-slate-800 opacity-60'
              }
              title={graphValidation.isValid ? 'Save DAG Configuration' : `Cannot Save: ${graphValidation.reason}`}
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

        {/* Invalid Edge Connection Alert Toast */}
        {connectionError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-rose-100 dark:bg-rose-950/95 border border-rose-300 dark:border-rose-500 text-rose-700 dark:text-rose-200 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <div className="text-xs font-medium">{connectionError}</div>
            <button
              onClick={clearConnectionError}
              className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Categorized Node Palette Modal/Drawer */}
        <NodePaletteDrawer />

        {/* React Flow Canvas */}
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
          onEdgeClick={(_, edge) => deleteEdge(edge.id)}
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

export const PipelineStudioView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <div className="w-full h-full flex flex-col flex-1 min-h-[calc(100vh-130px)] relative overflow-hidden">
        <PipelineCanvasContent />
      </div>
    </ReactFlowProvider>
  );
};
