import React, { useState } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import type { CustomNodeData } from '../../types/canvas';
import { DynamicFormEngine } from '../dynamicForm/DynamicFormEngine';
import { NodeDryRunner } from './NodeDryRunner';
import { Sliders, X, Trash2, Play, Settings, Info } from 'lucide-react';

export const NodeInspectorDrawer: React.FC = () => {
  const { nodes, selectedNodeId, selectNode, updateNodeConfig, deleteNode } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<'config' | 'dryrun'>('config');

  if (!selectedNodeId) return null;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNode) return null;

  // Handles ingestion node or terminal node
  if (selectedNode.type !== 'controlNode') {
    const nodeLabel = String(selectedNode.data?.label || 'Node Inspector');
    return (
      <div className="w-96 app-surface border-l app-border flex flex-col h-full shadow-2xl z-20 transition-colors">
        <div className="p-4 border-b app-border flex items-center justify-between bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold app-text-main">{nodeLabel}</h3>
          </div>
          <button
            onClick={() => selectNode(null)}
            className="app-text-muted hover:app-text-main p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 text-xs space-y-4">
          <p className="leading-relaxed app-text-subtle">
            This is a system anchor node. Connections to this node dictate entry ingestion or terminal execution routing.
          </p>
          <div className="app-card p-3 rounded-lg border app-border font-mono space-y-1 text-[11px] text-cyan-600 dark:text-cyan-400">
            <div>Type: <span className="font-semibold app-text-main">{selectedNode.type}</span></div>
            <div>ID: <span className="font-semibold app-text-main">{selectedNode.id}</span></div>
          </div>
        </div>
      </div>
    );
  }

  const customData = selectedNode.data as unknown as CustomNodeData;
  const control = customData.control;

  const handleFormChange = (newConfigValues: Record<string, any>, dynamicPorts?: any[]) => {
    updateNodeConfig(selectedNodeId, newConfigValues, dynamicPorts);
  };

  return (
    <div className="w-[420px] app-surface border-l app-border flex flex-col h-full shadow-2xl z-20 select-none transition-colors">
      {/* Drawer Header */}
      <div className="p-4 border-b app-border space-y-4 bg-black/5 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold app-text-main truncate max-w-[220px] leading-tight">{control.name}</h3>
              <span className="text-[10px] uppercase font-mono app-text-subtle">{control.category}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg border app-border">
            <button
              onClick={() => deleteNode(selectedNodeId)}
              title="Delete node from canvas"
              className="app-text-muted hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
            <button
              onClick={() => selectNode(null)}
              className="app-text-muted hover:app-text-main p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex app-surface p-1 rounded-lg border app-border">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 rounded-md transition-all ${
              activeTab === 'config'
                ? 'app-card text-cyan-600 dark:text-cyan-400 shadow-sm border app-border'
                : 'border border-transparent app-text-muted hover:app-text-main'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Dynamic Form
          </button>
          <button
            onClick={() => setActiveTab('dryrun')}
            className={`flex-1 py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 rounded-md transition-all ${
              activeTab === 'dryrun'
                ? 'app-card text-cyan-600 dark:text-cyan-400 shadow-sm border app-border'
                : 'border border-transparent app-text-muted hover:app-text-main'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Isolation Dry-Run
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="app-card p-4 rounded-xl border app-border shadow-sm">
              <span className="text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-400 block font-semibold mb-2 flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Description
              </span>
              <p className="text-xs app-text-subtle leading-relaxed">{control.description}</p>
            </div>

            {/* Dynamic Form Engine */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold app-text-main uppercase tracking-wider flex items-center gap-2 pb-2 border-b app-border">
                <Sliders className="w-3.5 h-3.5 text-cyan-500" /> Schema Parameters
              </h4>
              <DynamicFormEngine
                uiForm={control.uiForm}
                values={customData.configValues}
                onChange={handleFormChange}
              />
            </div>
          </div>
        )}

        {activeTab === 'dryrun' && (
          <NodeDryRunner nodeId={selectedNodeId} control={control} currentConfig={customData.configValues} />
        )}
      </div>
    </div>
  );
};

