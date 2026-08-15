import React from 'react';
import dashboardData from '../data/dashboardData.json';
import {
  LayoutDashboard,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Globe,
  Bot,
  Clock,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    summaryKpis,
    latencyPercentiles,
    savingsBreakdown,
    securityEventsFeed,
    hourlyThroughput,
    guardrailDistribution,
    regionalHealth,
    modelBreakdown,
  } = dashboardData;

  const maxRps = Math.max(...hourlyThroughput.map((item) => item.rps));

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-500" /> Operations Dashboard
          </h1>
          <p className="text-xs app-text-muted mt-1">
            Data-driven real-time KPIs, latency percentiles, FinOps savings breakdown, and live threat feed.
          </p>
        </div>
        <span className="text-xs font-mono app-card border px-3 py-1.5 rounded-md font-semibold">
          Data Store: src/data/dashboardData.json
        </span>
      </div>

      {/* 1. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="app-card border p-4 rounded-lg space-y-2">
          <span className="text-[11px] font-mono app-text-muted uppercase font-semibold">Total Invocations (24h)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold">{summaryKpis.totalInvocations}</span>
            <span className="text-xs font-mono text-emerald-500 font-bold flex items-center gap-0.5">
              +{summaryKpis.invocationsGrowthPct}% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <span className="text-[10px] app-text-subtle font-mono">P99 Latency: {summaryKpis.p99LatencyMs}ms</span>
        </div>

        <div className="app-card border p-4 rounded-lg space-y-2">
          <span className="text-[11px] font-mono app-text-muted uppercase font-semibold">Guardrail Interceptions</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-500">{summaryKpis.guardrailIncidents} Incidents</span>
            <span className="text-xs font-mono text-emerald-500 font-bold">{summaryKpis.mitigationRatePct}% Mitigated</span>
          </div>
          <span className="text-[10px] app-text-subtle font-mono">PII Redactions & Tool Authz</span>
        </div>

        <div className="app-card border p-4 rounded-lg space-y-2">
          <span className="text-[11px] font-mono app-text-muted uppercase font-semibold">Active Agent Fleets</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold">{summaryKpis.activeFleets} Fleets</span>
            <span className="text-xs font-mono text-blue-500 font-bold">{summaryKpis.workspacesCount} Workspaces</span>
          </div>
          <span className="text-[10px] app-text-subtle font-mono">Gateway Hook Enforced</span>
        </div>

        <div className="app-card border p-4 rounded-lg space-y-2">
          <span className="text-[11px] font-mono app-text-muted uppercase font-semibold">Token Spend vs Budget Cap</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold">${summaryKpis.currentSpendUsd.toLocaleString()}</span>
            <span className="text-xs font-mono app-text-muted">Cap: ${summaryKpis.budgetCapUsd.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#27272a] h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${summaryKpis.spendPercentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* 2. Latency Percentiles & FinOps Savings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Percentiles */}
        <div className="app-card border p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Latency Percentiles Breakdown
            </h3>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">All Targets Met</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {latencyPercentiles.map((p) => (
              <div key={p.label} className="app-surface border p-3 rounded-lg text-center space-y-1">
                <span className="text-[10px] font-mono app-text-muted uppercase block font-semibold">{p.label}</span>
                <span className={`text-xl font-extrabold block ${p.color}`}>{p.value}</span>
                <span className="text-[9px] font-mono app-text-subtle">Target: {p.target}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FinOps Cost Savings */}
        <div className="app-card border p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> FinOps Savings (${summaryKpis.totalSavedUsd.toLocaleString()})
            </h3>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">+38% ROI</span>
          </div>

          <div className="space-y-2">
            {savingsBreakdown.map((s) => (
              <div key={s.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{s.name}</span>
                  <span className="font-mono text-emerald-500 font-bold">{s.saved} ({s.pct}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                  <div className={`${s.color} h-full rounded-full`} style={{ width: `${s.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main Throughput Graph & Guardrail Interception Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Throughput Time-Series */}
        <div className="app-card border p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Hourly Throughput (Requests / sec)
            </h3>
            <span className="text-[10px] font-mono app-text-muted">Peak: {maxRps} RPS</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-1.5 pt-4">
            {hourlyThroughput.map((item) => (
              <div key={item.time} className="flex-1 bg-slate-200 dark:bg-[#27272a] hover:bg-blue-600 rounded-t transition-all group relative cursor-pointer">
                <div
                  className="bg-blue-600 rounded-t w-full transition-all"
                  style={{ height: `${(item.rps / maxRps) * 100}%` }}
                ></div>

                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 app-card border text-[10px] font-mono px-2 py-1 rounded z-10 whitespace-nowrap shadow-lg">
                  {item.time}: {item.rps} RPS
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] font-mono app-text-muted pt-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Guardrail Incident Breakdown */}
        <div className="app-card border p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Guardrail Interception Distribution
          </h3>

          <div className="space-y-3 pt-2">
            {guardrailDistribution.map((g) => (
              <div key={g.id} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{g.name}</span>
                  <span className="font-mono app-text-muted">{g.count} incidents ({g.pct}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-[#27272a] h-2 rounded-full overflow-hidden">
                  <div className={`${g.color} h-full rounded-full`} style={{ width: `${g.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Security Threats Feed & Regional Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Intercepted Security Feed */}
        <div className="app-card border p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Live Intercepted Security Threat Feed
          </h3>

          <div className="space-y-2">
            {securityEventsFeed.map((e) => (
              <div key={e.id} className="app-surface border p-3 rounded-lg space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-blue-500">[{e.timestamp}] {e.agent}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                      e.severity === 'critical'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                        : e.severity === 'high'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                    }`}
                  >
                    {e.severity}
                  </span>
                </div>
                <div className="font-semibold">{e.threat}</div>
                <div className="flex items-center justify-between text-[10px] font-mono app-text-muted pt-1">
                  <span>Rule: {e.rule}</span>
                  <span className="text-emerald-500 font-bold">{e.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Gateways SLA */}
        <div className="app-card border p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" /> Regional Ingestion Gateway SLA
          </h3>

          <div className="space-y-2">
            {regionalHealth.map((r) => (
              <div key={r.region} className="app-surface border p-3 rounded flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="font-bold block">{r.region}</span>
                  <span className="text-[10px] app-text-subtle">SLA: {r.egressSlaPct}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>RPS: <strong className="text-blue-500">{r.rps}</strong></span>
                  <span>Latency: <strong>{r.latencyMs}ms</strong></span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      r.status === 'healthy'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
