import React, { useState } from 'react';
import { useFinOpsStore } from '../../store/finopsStore';
import {
  DollarSign,
  TrendingDown,
  Zap,
  Sparkles,
  Shield,
  BarChart3,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';

export const FinOpsView: React.FC = () => {
  const { data: finops, projectedQueryGrowthPercent, setProjectedGrowth, setCircuitBreakerThreshold } = useFinOpsStore();
  const [activeTab, setActiveTab] = useState<'inform' | 'optimise' | 'operate'>('inform');

  const projectedMonthlySpend = Math.round(
    finops.totalSpendCurrentMonth * (1 + projectedQueryGrowthPercent / 100)
  );
  const budgetUtilizationPct = Math.min(
    100,
    Math.round((finops.totalSpendCurrentMonth / finops.monthlyBudgetCap) * 100)
  );

  const totalSavingsRealized = (
    (finops.semanticCacheSavings || 0) +
    (finops.contextPruningSavings || 0) +
    (finops.slmOffloadingSavings || 0)
  );

  const costByAgent = finops.costByAgent || [];
  const costByModel = finops.costByModel || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" /> FinOps, Unit Economics & Predictive Budgeting
          </h1>
          <p className="text-xs app-text-muted mt-1">
            Inform (chargeback), Optimise (cache ROI & pruning), and Operate (circuit breakers & growth simulation).
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 app-surface p-1 rounded-lg border">
          {(['inform', 'optimise', 'operate'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'app-text-muted hover:text-blue-500'
              }`}
            >
              {tab === 'inform' ? '1. Inform' : tab === 'optimise' ? '2. Optimise' : '3. Operate'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 FinOps Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="app-card border p-4 rounded-lg space-y-2">
          <span className="text-[11px] font-mono app-text-muted uppercase font-semibold">Current Month Spend</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold">${finops.totalSpendCurrentMonth.toLocaleString()}</span>
            <span className="text-xs font-mono app-text-muted">Cap: ${finops.monthlyBudgetCap.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-[#27272a] h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${budgetUtilizationPct}%` }}></div>
          </div>
        </div>

        <div className="app-card border p-4 rounded-lg space-y-2">
          <span className="text-[11px] font-mono app-text-muted uppercase font-semibold">Total Savings Realized</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-500">
              ${totalSavingsRealized.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-emerald-500 font-bold">+38.4% ROI</span>
          </div>
          <span className="text-[10px] app-text-subtle font-mono">Cache + Pruning + SLM</span>
        </div>

        <div className="app-card border p-4 rounded-lg space-y-2">
          <span className="text-[11px] font-mono app-text-muted uppercase font-semibold">Predicted Run-Out</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-500">Day 26</span>
            <span className="text-xs font-mono text-amber-500 font-bold">Aug 26</span>
          </div>
          <span className="text-[10px] app-text-subtle font-mono">Simulated at +{projectedQueryGrowthPercent}% growth</span>
        </div>

        <div className="app-card border p-4 rounded-lg space-y-2">
          <span className="text-[11px] font-mono app-text-muted uppercase font-semibold">Circuit Breaker Status</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-emerald-500 font-mono">
              {finops.circuitBreakerActive ? 'ARMED' : 'OFF'}
            </span>
            <span className="text-xs font-mono app-badge-success px-2 py-0.5 rounded font-bold">
              ${finops.circuitBreakerThreshold} Cap
            </span>
          </div>
          <span className="text-[10px] app-text-subtle font-mono">Action: {finops.circuitBreakerAction}</span>
        </div>
      </div>

      {/* TAB 1: INFORM */}
      {activeTab === 'inform' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Showback per Agent Fleet */}
            <div className="app-card border p-5 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-500" /> Showback: Cost Allocation per Agent Fleet
                </h3>
                <button className="text-xs text-blue-500 font-mono flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export PDF Statement
                </button>
              </div>

              <div className="space-y-3">
                {costByAgent.map((agent) => (
                  <div key={agent.agentId} className="app-surface border p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold block">{agent.agentName}</span>
                      <span className="text-[10px] app-text-subtle">ID: {agent.agentId}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span>Spend: <strong className="text-emerald-500">${agent.spend.toFixed(2)}</strong></span>
                      <span className="app-text-muted">({agent.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spend by Model Class */}
            <div className="app-card border p-5 rounded-lg space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" /> Model Unit Economics Distribution
              </h3>

              <div className="space-y-3">
                {costByModel.map((m) => (
                  <div key={m.modelName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{m.modelName}</span>
                      <span className="font-mono text-emerald-500">${m.cost.toFixed(2)} ({m.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-[#27272a] h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${m.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPTIMISE */}
      {activeTab === 'optimise' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="app-card border p-5 rounded-lg space-y-3">
            <div className="p-2 rounded bg-blue-500/10 text-blue-500 w-fit border border-blue-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">Semantic Cache Router</h3>
            <div className="text-2xl font-extrabold text-emerald-500">
              ${finops.semanticCacheSavings.toLocaleString()}
            </div>
            <p className="text-xs app-text-muted">
              Vector similarity cache direct hits bypassed frontier LLM calls, saving 4.2M input tokens.
            </p>
          </div>

          <div className="app-card border p-5 rounded-lg space-y-3">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-500 w-fit border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">LLM Lingua Context Pruning</h3>
            <div className="text-2xl font-extrabold text-emerald-500">
              ${finops.contextPruningSavings.toLocaleString()}
            </div>
            <p className="text-xs app-text-muted">
              Removed non-essential tokens from system prompts before forwarding to GPT-4o.
            </p>
          </div>

          <div className="app-card border p-5 rounded-lg space-y-3">
            <div className="p-2 rounded bg-purple-500/10 text-purple-500 w-fit border border-purple-500/30">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">SLM Fast Offloading</h3>
            <div className="text-2xl font-extrabold text-emerald-500">
              ${finops.slmOffloadingSavings.toLocaleString()}
            </div>
            <p className="text-xs app-text-muted">
              Routed non-complex queries directly to gpt-4o-mini, lowering average cost per query.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATE */}
      {activeTab === 'operate' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interactive Growth Slider */}
          <div className="app-card border p-5 rounded-lg space-y-5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" /> Interactive Query Growth Calculator
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="app-text-muted">Simulated Query Growth:</span>
                <span className="font-bold text-blue-500">+{projectedQueryGrowthPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={projectedQueryGrowthPercent}
                onChange={(e) => setProjectedGrowth(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="app-surface border p-4 rounded-lg space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>Baseline Monthly Spend:</span>
                <span>${finops.totalSpendCurrentMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Projected Monthly Spend:</span>
                <span className="text-amber-500">${projectedMonthlySpend.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Budget Cap:</span>
                <span>${finops.monthlyBudgetCap.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Automated Circuit Breakers Config */}
          <div className="app-card border p-5 rounded-lg space-y-5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" /> Automated Budget Circuit Breakers
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between app-surface border p-3 rounded-lg">
                <div>
                  <span className="font-bold block">Hard Spend Threshold ($)</span>
                  <span className="app-text-muted text-[10px]">Auto-switch all traffic to gpt-4o-mini SLM</span>
                </div>
                <input
                  type="number"
                  value={finops.circuitBreakerThreshold}
                  onChange={(e) => setCircuitBreakerThreshold(parseInt(e.target.value, 10))}
                  className="w-20 app-card border rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between app-surface border p-3 rounded-lg">
                <div>
                  <span className="font-bold block">100% Budget Exhaustion</span>
                  <span className="app-text-muted text-[10px]">Reject non-critical requests with 503 Service Unavailable</span>
                </div>
                <span className="app-badge-danger px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                  ENFORCED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
