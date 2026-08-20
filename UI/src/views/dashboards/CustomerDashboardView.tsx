import React from 'react';
import {
  Users,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Activity,
  Bot,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const CustomerDashboardView: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" /> Customer Tenant Dashboard — Global FinTech Corp
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated client tenant dashboard for account SLA management, active agent pipelines, and customer isolation status.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs bg-slate-900 border border-slate-800 p-2 rounded-lg">
          <span className="text-slate-400">Tenant ID:</span>
          <span className="font-bold text-indigo-400">tnt_fintech_corp_9021</span>
        </div>
      </div>

      {/* Top Tenant Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tenant Invocations (24h)</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">842,100</div>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" /> 100% Guaranteed Egress SLA
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Latency P99</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">14 ms</div>
          <p className="text-[11px] text-slate-400 font-mono">Target &lt; 50ms</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Agent Fleets</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">3 Fleets</div>
          <p className="text-[11px] text-slate-400 font-mono">18 Ingestion Endpoints</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Tenant Monthly Budget</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">$1,890.10</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: '62%' }}></div>
          </div>
        </div>
      </div>

      {/* Tenant Pipelines */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" /> Active Governance Pipelines for Global FinTech Corp
        </h3>

        <div className="space-y-3">
          {[
            {
              id: 'pipe_compliance_v1',
              name: 'Strict Financial Compliance (SOX / PCI)',
              agent: 'Support Automation Tier-1',
              status: 'Active / Enforcing',
              nodes: 5,
              lastRun: '10s ago',
            },
            {
              id: 'pipe_wealth_v2',
              name: 'Wealth Management Permissive DAG',
              agent: 'Wealth Advisor Assistant',
              status: 'Active / Enforcing',
              nodes: 4,
              lastRun: '2m ago',
            },
          ].map((p) => (
            <div key={p.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <span className="font-mono text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-bold">
                    {p.id}
                  </span>
                </div>
                <p className="text-slate-400">Assigned Agent: <strong className="text-slate-200">{p.agent}</strong> ({p.nodes} Pre-Wired Controls)</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-mono text-[11px]">Last Activity: {p.lastRun}</span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded text-xs font-bold font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
