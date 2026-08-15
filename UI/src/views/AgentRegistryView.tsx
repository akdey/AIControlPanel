import React, { useState } from 'react';
import { useAgentStore } from '../store/agentStore';
import {
  Bot,
  Shield,
  Sliders,
  CheckCircle2,
  Lock,
  Plus,
  Search,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

export const AgentRegistryView: React.FC = () => {
  const { agents, selectedAgentId, selectAgent, updateAgentPolicy, updateAgentStatus } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 text-slate-100">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-cyan-400" /> External Agent Registry & Cryptographic Policy Profiles
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Catalog of external agents sending traffic through the gateway with mTLS delegation identity and rate-limit budgets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search agents by name, role, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none w-64"
            />
          </div>
          <button
            onClick={() => alert('Register Agent Wizard Modal')}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-950"
          >
            <Plus className="w-4 h-4" /> Register New Agent
          </button>
        </div>
      </div>

      {/* Main Grid: Cards & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Cards */}
        {filteredAgents.map((agent) => {
          const isSelected = agent.id === selectedAgentId;
          const pctSpend = Math.min(100, Math.round((agent.monthlySpend / agent.monthlyLimit) * 100));

          return (
            <div
              key={agent.id}
              onClick={() => selectAgent(agent.id)}
              className={`bg-slate-900/90 border rounded-xl p-5 space-y-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-xl shadow-cyan-950'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                    <span className="text-[11px] font-mono text-cyan-400">Role: {agent.role}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded border ${
                    agent.status === 'active'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : agent.status === 'rate_limited'
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}
                >
                  {agent.status}
                </span>
              </div>

              {/* Associated Pipeline */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs flex items-center justify-between">
                <span className="text-slate-400">Pipeline Canvas:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[150px]">{agent.associatedPipeline}</span>
              </div>

              {/* Monthly Spend Budget Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Monthly Spend</span>
                  <span className="font-mono text-slate-200">
                    ${agent.monthlySpend.toFixed(2)} / ${agent.monthlyLimit.toFixed(2)} ({pctSpend}%)
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      pctSpend > 90 ? 'bg-rose-500' : pctSpend > 75 ? 'bg-amber-400' : 'bg-cyan-400'
                    }`}
                    style={{ width: `${pctSpend}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <div>Invocations (24h): <span className="text-slate-200 font-bold">{agent.totalInvocations24h.toLocaleString()}</span></div>
                <div className="text-right">Blocked Incidents: <span className="text-rose-400 font-bold">{agent.blockedIncidents24h}</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Policy Drawer Panel */}
      {selectedAgent && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">
                  Governance Policy Profile: <span className="text-cyan-400">{selectedAgent.name}</span>
                </h2>
                <span className="text-xs font-mono text-slate-400">Agent ID: {selectedAgent.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Quick Status Override:</span>
              <select
                value={selectedAgent.status}
                onChange={(e) => updateAgentStatus(selectedAgent.id, e.target.value as any)}
                className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-3 py-1.5 font-semibold"
              >
                <option value="active">ACTIVE</option>
                <option value="rate_limited">RATE LIMITED</option>
                <option value="quarantined">QUARANTINED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tool Whitelist & Blacklist */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" /> Tool Access Permissions (RBAC)
              </h3>

              {/* Whitelist */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Whitelisted Tools
                </span>
                <div className="space-y-1">
                  {selectedAgent.policyProfile.allowedTools.map((t) => (
                    <div
                      key={t}
                      className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded font-mono flex items-center justify-between"
                    >
                      <span>{t}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Blacklist */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                  Blacklisted / Unauthorized Tools
                </span>
                <div className="space-y-1">
                  {selectedAgent.policyProfile.blockedTools.map((t) => (
                    <div
                      key={t}
                      className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs px-2.5 py-1 rounded font-mono flex items-center justify-between"
                    >
                      <span>{t}</span>
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rate-Limit Budgets */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Rate-Limit Budget Meters
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-medium">Tokens Per Minute (TPM)</label>
                  <input
                    type="number"
                    value={selectedAgent.policyProfile.tpmLimit}
                    onChange={(e) =>
                      updateAgentPolicy(selectedAgent.id, { tpmLimit: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 font-mono text-xs text-cyan-400 border border-slate-700 rounded px-3 py-1.5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-medium">Requests Per Minute (RPM)</label>
                  <input
                    type="number"
                    value={selectedAgent.policyProfile.rpmLimit}
                    onChange={(e) =>
                      updateAgentPolicy(selectedAgent.id, { rpmLimit: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-900 font-mono text-xs text-cyan-400 border border-slate-700 rounded px-3 py-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Cryptographic Identity */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" /> Cryptographic Identity & mTLS
              </h3>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">mTLS Client Cert Fingerprint</span>
                  <div className="font-mono text-[11px] text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800 break-all">
                    {selectedAgent.policyProfile.mtlsFingerprint}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Delegation Token Validity</span>
                  <div className="font-mono text-[11px] text-emerald-400 bg-slate-900 p-2 rounded border border-slate-800">
                    {selectedAgent.policyProfile.delegationTokenValidUntil}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
