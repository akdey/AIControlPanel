import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Activity,
  AlertOctagon,
  Users,
  Globe,
  ArrowUpRight,
  ShieldAlert,
  Bot,
} from 'lucide-react';
import { useFinOpsStore } from '../../store/finopsStore';

export const ExecutiveDashboardView: React.FC = () => {
  const { data: finops } = useFinOpsStore();

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-indigo-400" /> Executive Overview Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            High-level executive metrics for aggregate agent traffic, compliance SLAs, token spend, and active guardrails.
          </p>
        </div>
        <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1.5 rounded-lg font-bold">
          Q3 Enterprise Summary
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invocations (24h)</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">2.4M</span>
            <span className="text-xs font-mono font-bold text-emerald-400 flex items-center">
              +18.4% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Avg throughput 1,650 RPS</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Compliance SLA</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-400">99.99%</span>
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              SOX / PCI Compliant
            </span>
          </div>
          <p className="text-[11px] text-slate-400">0 Data Leaks, 0 Unhandled Breaches</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Spend vs Cap</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white">${finops.totalSpendCurrentMonth.toLocaleString()}</span>
            <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              Cap: ${finops.monthlyBudgetCap.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{ width: `${(finops.totalSpendCurrentMonth / finops.monthlyBudgetCap) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Interceptions & Blocks</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-rose-400">342</span>
            <span className="text-xs font-mono font-bold text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
              100% Intercepted
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Toxicity, SQL Injection, PII Redacted</p>
        </div>
      </div>

      {/* Middle Row: Active Projects & Regional Fleet Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" /> Enterprise Multi-Tenant Workspaces
          </h3>

          <div className="space-y-3">
            {[
              { name: 'Global FinTech Operations', agents: 12, throughput: '1,420 RPS', spend: '$1,890.10', health: 'Healthy' },
              { name: 'Wealth Management AI Advisor', agents: 6, throughput: '640 RPS', spend: '$820.00', health: 'Healthy' },
              { name: 'Automated Claims Processing', agents: 8, throughput: '910 RPS', spend: '$420.50', health: 'Rate Limited' },
            ].map((p) => (
              <div key={p.name} className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-slate-200">{p.name}</h4>
                  <span className="text-slate-400 font-mono text-[11px]">{p.agents} Active Agent Fleets</span>
                </div>
                <div className="flex items-center gap-6 font-mono text-xs">
                  <span>RPS: <strong className="text-indigo-400">{p.throughput}</strong></span>
                  <span>Spend: <strong className="text-slate-200">{p.spend}</strong></span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.health === 'Healthy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'}`}>
                    {p.health}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guardrail Policy Enforcement Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" /> Top Intercepted Guardrails
          </h3>

          <div className="space-y-3">
            {[
              { name: 'PII Redaction (Microsoft Presidio)', count: 184, pct: 54 },
              { name: 'OPA / Cedar Tool Authorization', count: 92, pct: 27 },
              { name: 'Prompt Injection Shield (Rebuff)', count: 42, pct: 12 },
              { name: 'Toxicity Moderation (RoBERTa)', count: 24, pct: 7 },
            ].map((g) => (
              <div key={g.name} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span className="truncate max-w-[200px]">{g.name}</span>
                  <span className="font-mono text-indigo-400">{g.count} ({g.pct}%)</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${g.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
