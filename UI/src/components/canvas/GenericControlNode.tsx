import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CustomNodeData } from '../../types/canvas';
import { PORT_TYPE_METADATA } from '../../helpers/isValidConnection';
import {
  ShieldAlert,
  GitFork,
  Lock,
  Zap,
  Box,
  CheckCircle2,
  AlertOctagon,
  Settings2,
  Cpu,
  Plus
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  guardrails: ShieldAlert,
  routing: GitFork,
  policy: Lock,
  optimization: Zap,
  sandboxing: Box,
};

export const GenericControlNode = memo(({ data, selected, id }: NodeProps) => {
  const customData = data as unknown as CustomNodeData;
  const control = customData.control;
  const edges = useCanvasStore((s) => s.edges);
  const setNodeSelectorPos = useCanvasStore((s) => s.setNodeSelectorPos);

  if (!control) return null;

  const IconComponent = CATEGORY_ICONS[control.category] || Cpu;

  // Ports
  const inputs = control?.ports?.inputs || [];
  const outputs = control?.ports?.outputs || [];
  const dynamicOutputs = customData?.dynamicPorts || [];
  const allOutputs = [...outputs, ...dynamicOutputs];

  const status = customData.status || 'idle';
  const metrics = customData.lastRunMetrics;

  const handleAddClick = (e: React.MouseEvent, portId: string, portType: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setNodeSelectorPos({ 
      x: rect.right + 15, 
      y: rect.top - 10, 
      sourceNodeId: id, 
      sourcePortId: portId,
      sourcePortType: portType
    });
  };

  return (
    <div
      className={`w-72 app-card backdrop-blur-md rounded-xl transition-all shadow-2xl relative ${
        selected
          ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-500/10'
          : status === 'blocked'
          ? 'border-rose-500/70'
          : status === 'passed'
          ? 'border-emerald-500/50'
          : 'app-border hover:border-slate-400 dark:hover:border-slate-700'
      }`}
    >
      {/* Header Bar */}
      <div className="app-surface px-3.5 py-2.5 border-b app-border flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold truncate max-w-[150px]">{control.name}</h3>
            <span className="text-[10px] uppercase tracking-wider font-mono app-text-subtle">
              {control.category}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {status === 'passed' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> PASS
          </span>
        )}
        {status === 'blocked' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30">
            <AlertOctagon className="w-3 h-3" /> BLOCKED
          </span>
        )}
        {status === 'idle' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono app-text-muted app-surface px-2 py-0.5 rounded border app-border">
            IDLE
          </span>
        )}
      </div>

      {/* Input Handles (Centered if 1, evenly spaced if multiple) */}
      {inputs.map((port, idx) => {
        const topPercent = inputs.length === 1 ? '50%' : `${((idx + 1) / (inputs.length + 1)) * 100}%`;
        const meta = PORT_TYPE_METADATA[port.type] || { color: '#06b6d4' };

        return (
          <Handle
            key={port.id}
            type="target"
            position={Position.Left}
            id={port.id}
            style={{
              backgroundColor: meta.color,
              borderColor: 'var(--border-card)',
              width: 12,
              height: 12,
              left: -14,
              top: topPercent,
              transform: 'translateY(-50%)',
              zIndex: 40,
            }}
          />
        );
      })}

      {/* Output Handles / [+] Buttons (Centered if 1, evenly spaced if multiple) */}
      {allOutputs.map((port, idx) => {
        const topPercent = allOutputs.length === 1 ? '50%' : `${((idx + 1) / (allOutputs.length + 1)) * 100}%`;
        const meta = PORT_TYPE_METADATA[port.type] || { color: '#06b6d4' };
        const isConnected = edges.some((e) => e.source === id && e.sourceHandle === port.id);

        return (
          <div
            key={port.id}
            className="absolute -right-[38px] flex items-center z-30 pointer-events-auto"
            style={{
              top: topPercent,
              transform: 'translateY(-50%)',
            }}
          >
            <div className="w-5 h-[2px] bg-slate-400/80 dark:bg-slate-500" />
            {isConnected ? (
              <Handle
                type="source"
                position={Position.Right}
                id={port.id}
                style={{
                  backgroundColor: meta.color,
                  borderColor: 'var(--border-card)',
                  width: 12,
                  height: 12,
                  position: 'relative',
                  right: 0,
                  transform: 'none',
                  zIndex: 40,
                }}
              />
            ) : (
              <Handle
                type="source"
                position={Position.Right}
                id={port.id}
                onClick={(e) => handleAddClick(e, port.id, port.type)}
                className="!w-6 !h-6 !rounded-md !bg-slate-800 dark:!bg-slate-900 border border-slate-600 hover:border-cyan-400 text-slate-200 hover:text-white hover:bg-cyan-600 flex items-center justify-center transition-all shadow-xl hover:scale-110 cursor-pointer !relative !right-0 !transform-none"
                title={`Drag to connect, or click to add node for ${port.label}`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5] pointer-events-none" />
              </Handle>
            )}
          </div>
        );
      })}

      {/* Description Snippet */}
      <div className="p-3 space-y-2.5">
        <p className="text-[11px] app-text-muted line-clamp-2 leading-relaxed">
          {control.description}
        </p>

        {/* Configuration Summary Badge */}
        <div className="app-surface p-2 rounded-lg border app-border text-[11px] font-mono space-y-1">
          <div className="text-[10px] app-text-subtle font-sans font-semibold uppercase flex items-center gap-1">
            <Settings2 className="w-3 h-3 text-cyan-500 dark:text-cyan-400" /> Engine: {control.runtimeConfig.engine}
          </div>
          {metrics && (
            <div className="flex items-center justify-between app-text-muted pt-0.5 border-t app-border">
              <span>Latency:</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">{metrics.latencyMs} ms</span>
            </div>
          )}
        </div>

        {/* Port Badges List */}
        <div className="pt-2 border-t app-border space-y-1.5">
          {allOutputs.length > 1 ? (
            allOutputs.map((port) => (
              <div key={port.id} className="flex items-center justify-between text-[10px]">
                <span className="app-text-muted truncate max-w-[150px]">{port.label}</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-500/20">
                  {port.type}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-mono text-[9px] app-text-subtle">
                IN: {inputs[0]?.label || 'Payload'}
              </span>
              <span className="font-mono text-[9px] app-text-subtle">
                OUT: {allOutputs[0]?.label || 'Sanitized'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

GenericControlNode.displayName = 'GenericControlNode';
