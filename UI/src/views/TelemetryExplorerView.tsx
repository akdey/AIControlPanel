import React, { useState } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import {
  Activity,
  Search,
  Clock,
  SkipForward,
  SkipBack,
  FileCode,
  Tag,
} from 'lucide-react';

export const TelemetryExplorerView: React.FC = () => {
  const {
    traces,
    selectedTraceId,
    selectTrace,
    activeFilterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    replayStepIndex,
    setReplayStep,
    stepForwardReplay,
    stepBackwardReplay,
  } = useTelemetryStore();

  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  const selectedTrace = traces.find((t) => t.id === selectedTraceId) || traces[0];

  const filteredTraces = traces.filter((t) => {
    const matchesStatus = activeFilterStatus === 'all' || t.status === activeFilterStatus;
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.modelUsed.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const activeSpan = selectedTrace.spans.find((s) => s.id === selectedSpanId) || selectedTrace.spans[replayStepIndex] || selectedTrace.spans[0];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-slate-100">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-cyan-400" /> Pipeline Telemetry, Span Waterfalls & Step Replay
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete execution observability mapped over Langfuse backend with node Gantt waterfalls and side-by-side payload diffs.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Trace ID, Agent, Model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none w-64"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {['all', 'passed', 'blocked'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeFilterStatus === st
                    ? 'bg-cyan-600 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Trace List & Execution Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Trace List */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Traces ({filteredTraces.length})</span>
            <span className="text-[10px] font-mono text-cyan-400">Live Langfuse Stream</span>
          </h2>

          <div className="space-y-2 max-h-[700px] overflow-y-auto custom-scrollbar">
            {filteredTraces.map((trace) => {
              const isSelected = trace.id === selectedTrace.id;
              return (
                <div
                  key={trace.id}
                  onClick={() => {
                    selectTrace(trace.id);
                    setSelectedSpanId(null);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">#{trace.id}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        trace.status === 'passed'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border-rose-800'
                      }`}
                    >
                      {trace.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200">{trace.agentName}</div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Model: {trace.modelUsed}</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3 h-3 text-cyan-400" /> {trace.totalDurationMs} ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Gantt Waterfall + Replay + Payload Diff */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gantt Waterfall & Replayer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Trace Details: <span className="font-mono text-cyan-400">#{selectedTrace.id}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Agent: {selectedTrace.agentName} ({selectedTrace.projectName})
                </span>
              </div>

              {/* Canvas Step Replayer Controls */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider px-2">
                  Canvas Step Replay
                </span>
                <button
                  onClick={stepBackwardReplay}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-200 px-2">
                  Step {replayStepIndex + 1} / {selectedTrace.spans.length || 1}
                </span>
                <button
                  onClick={stepForwardReplay}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Waterfall Gantt Chart */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Span Duration Waterfall (Total {selectedTrace.totalDurationMs} ms)
              </h4>

              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedTrace.spans.length === 0 ? (
                  <div className="text-xs text-slate-400 p-4 text-center">
                    No span details captured for this trace summary.
                  </div>
                ) : (
                  selectedTrace.spans.map((span, idx) => {
                    const isStepActive = idx === replayStepIndex;
                    const isSelectedSpan = span.id === activeSpan?.id;
                    const pctLeft = Math.min(90, (span.startTime / selectedTrace.totalDurationMs) * 100);
                    const pctWidth = Math.max(8, (span.durationMs / selectedTrace.totalDurationMs) * 100);

                    return (
                      <div
                        key={span.id}
                        onClick={() => {
                          setSelectedSpanId(span.id);
                          setReplayStep(idx);
                        }}
                        className={`p-2 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                          isStepActive || isSelectedSpan
                            ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-500/30'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-400 text-[10px] flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>
                            {span.nodeName}
                          </span>
                          <span className="font-mono text-cyan-400 text-[11px]">{span.durationMs} ms</span>
                        </div>

                        {/* Gantt Bar */}
                        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden relative border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              span.status === 'blocked'
                                ? 'bg-rose-500'
                                : span.status === 'mutated'
                                ? 'bg-amber-400'
                                : 'bg-cyan-400'
                            }`}
                            style={{ marginLeft: `${pctLeft}%`, width: `${pctWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Span Inspection Panel (Payload Diff & Taint Flags) */}
          {activeSpan && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" /> Span Inspector & Payload Mutation Diff
                </h3>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                  Node: {activeSpan.nodeName}
                </span>
              </div>

              {/* Taint Tracking Flags */}
              {activeSpan.taintFlags && activeSpan.taintFlags.length > 0 && (
                <div className="flex items-center gap-2 bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/30 text-xs">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-amber-300">Taint Flags:</span>
                  <div className="flex gap-1.5">
                    {activeSpan.taintFlags.map((tf) => (
                      <span key={tf} className="font-mono text-[10px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded">
                        {tf}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingested vs Mutated Side-by-Side Diff */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Ingested Input Payload
                  </label>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto max-h-48 custom-scrollbar">
                    {JSON.stringify(activeSpan.inputPayload, null, 2)}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Mutated / Evaluated Output Payload
                  </label>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto max-h-48 custom-scrollbar">
                    {JSON.stringify(activeSpan.outputPayload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
