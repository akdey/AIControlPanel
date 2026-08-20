import React from 'react';
import {
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Activity,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const ObservabilityMetricsView: React.FC = () => {
  const metricItems = [
    { name: 'PII Entities Redacted / Faked Rate', value: '98.4%', trend: '+2.1%', status: 'optimal' },
    { name: 'Toxicity Classifier Precision (RoBERTa)', value: '99.1%', trend: '+0.4%', status: 'optimal' },
    { name: 'OPA Authorization Deny Rate', value: '2.4%', trend: '-0.8%', status: 'optimal' },
    { name: 'Sandbox Execution Egress Violation Rate', value: '0.00%', trend: '0.0%', status: 'optimal' },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-slate-100">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-400" /> Observability — Guardrail Evaluation & Score Metrics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Statistical distributions, classifier precision metrics, latency degradation histograms, and pass/fail enforcement trends.
          </p>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metricItems.map((m) => (
          <div key={m.name} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              {m.name}
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-white">{m.value}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{m.trend}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">30-day evaluation window</p>
          </div>
        ))}
      </div>

      {/* Distribution Charts & Histograms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Degradation per Guardrail Node */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Latency Cost per Node (ms)
          </h3>

          <div className="space-y-3">
            {[
              { node: 'Presidio PII Analyzer', avgMs: 14, p99Ms: 22, barWidth: '40%' },
              { node: 'Detoxify Toxicity ONNX Model', avgMs: 18, p99Ms: 31, barWidth: '55%' },
              { node: 'OPA Wasm Tool Authorization', avgMs: 4, p99Ms: 8, barWidth: '15%' },
              { node: 'Firecracker Micro-VM Execution', avgMs: 42, p99Ms: 85, barWidth: '90%' },
            ].map((l) => (
              <div key={l.node} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{l.node}</span>
                  <span className="font-mono text-indigo-400">Avg {l.avgMs} ms / P99 {l.p99Ms} ms</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: l.barWidth }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pass vs Fail Ratios */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Control Evaluation Outcome Breakdown
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Clean / Direct Pass', count: '1,420,100', pct: 92, color: 'bg-emerald-400' },
              { label: 'Mutated (PII Redacted)', count: '98,400', pct: 6, color: 'bg-amber-400' },
              { label: 'Blocked / Halted', count: '24,200', pct: 2, color: 'bg-rose-400' },
            ].map((o) => (
              <div key={o.label} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>{o.label}</span>
                  <span className="font-mono text-slate-200">{o.count} ({o.pct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className={`${o.color} h-full rounded-full`} style={{ width: `${o.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
