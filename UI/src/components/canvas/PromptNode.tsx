import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { IngestionNodeData, TerminalNodeData } from '../../types/canvas';
import { PORT_TYPE_METADATA } from '../../helpers/isValidConnection';
import { Play, ShieldCheck, ShieldAlert, Plus } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';

export const PromptNode = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as IngestionNodeData;
  const edges = useCanvasStore((s) => s.edges);
  const setNodeSelectorPos = useCanvasStore((s) => s.setNodeSelectorPos);

  const handleAddClick = (e: React.MouseEvent, portId: string, portType: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setNodeSelectorPos({ 
      x: rect.right + 15, 
      y: rect.top - 10, 
      sourceNodeId: id, 
      sourcePortId: portId,
      sourcePortType: portType,
    });
  };

  const firstPort = nodeData.ports[0] || { id: 'out_prompt_obj', type: 'prompt_object', label: 'Prompt Payload' };
  const isPortConnected = edges.some(
    (e) => e.source === id && e.sourceHandle === firstPort.id
  );

  return (
    <div
      className={`w-56 app-card backdrop-blur-md rounded-xl transition-all shadow-xl relative ${
        selected ? 'border-blue-400 ring-2 ring-blue-500/30' : 'app-border'
      }`}
    >
      <div className="bg-blue-500/10 px-3.5 py-2.5 border-b border-blue-500/20 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-blue-500" />
          <h3 className="text-xs font-bold text-blue-500">{nodeData.label || 'Agent Prompt'}</h3>
        </div>
        <span className="text-[9px] uppercase font-mono bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
          START
        </span>
      </div>

      <div className="p-3">
        <p className="text-xs app-text-muted mb-2.5">Entry point for the agent's LLM pipeline.</p>
        <div className="flex items-center justify-between pt-2 border-t app-border">
          <span className="text-[10px] font-mono app-text-subtle">Output Channel</span>
          <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">
            {firstPort.label}
          </span>
        </div>
      </div>

      {/* Centered Output Handle on Vertical Middle of Right Edge */}
      <div className="absolute -right-[38px] top-1/2 -translate-y-1/2 flex items-center z-30 pointer-events-auto">
        <div className="w-5 h-[2px] bg-slate-400/80 dark:bg-slate-500" />
        {isPortConnected ? (
          <Handle
            type="source"
            position={Position.Right}
            id={firstPort.id}
            style={{
              backgroundColor: '#3b82f6',
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
            id={firstPort.id}
            onClick={(e) => handleAddClick(e, firstPort.id, firstPort.type)}
            className="!w-6 !h-6 !rounded-md !bg-slate-800 dark:!bg-slate-900 border border-slate-600 hover:border-blue-400 text-slate-200 hover:text-white hover:bg-blue-600 flex items-center justify-center transition-all shadow-xl hover:scale-110 cursor-pointer !relative !right-0 !transform-none"
            title={`Drag to connect, or click to add node for ${firstPort.label}`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] pointer-events-none" />
          </Handle>
        )}
      </div>
    </div>
  );
});

PromptNode.displayName = 'PromptNode';

export const TerminalNode = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as TerminalNodeData;
  const isAllow = nodeData.actionType === 'allow_llm';
  const firstPort = nodeData.ports[0] || { id: 'in_term_pass', type: 'sanitized_prompt_object', label: 'Sanitized Prompt' };

  return (
    <div
      className={`w-64 app-card backdrop-blur-md rounded-xl transition-all shadow-xl relative ${
        selected
          ? 'border-cyan-400 ring-2 ring-cyan-500/30'
          : isAllow
          ? 'border-emerald-500/60'
          : 'border-rose-500/60'
      }`}
    >
      {/* Centered Input Handle on Vertical Middle of Left Edge */}
      <Handle
        type="target"
        position={Position.Left}
        id={firstPort.id}
        style={{
          backgroundColor: isAllow ? '#10b981' : '#f43f5e',
          borderColor: 'var(--border-card)',
          width: 12,
          height: 12,
          left: -14,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 40,
        }}
      />

      <div
        className={`px-3.5 py-2.5 border-b flex items-center justify-between rounded-t-xl ${
          isAllow ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
        }`}
      >
        <div className="flex items-center gap-2">
          {isAllow ? (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          )}
          <h3 className={`text-xs font-bold ${isAllow ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {nodeData.label}
          </h3>
        </div>
        <span
          className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${
            isAllow
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
          }`}
        >
          TERMINAL
        </span>
      </div>

      <div className="p-3 space-y-2 text-xs">
        <p className="text-[11px] app-text-muted leading-relaxed">{nodeData.description}</p>
        <div className="flex items-center justify-between pt-2 border-t app-border">
          <span className="text-[10px] font-mono app-text-subtle">Input Channel</span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${isAllow ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500' : 'bg-rose-950/80 text-rose-400 border-rose-500'}`}>
            {firstPort.label}
          </span>
        </div>
      </div>
    </div>
  );
});

TerminalNode.displayName = 'TerminalNode';
