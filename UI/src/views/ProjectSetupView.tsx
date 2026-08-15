import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import {
  FolderPlus,
  Shield,
  Key,
  Eye,
  CheckCircle2,
  Copy,
  RefreshCw,
  Sliders,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const ProjectSetupView: React.FC = () => {
  const { currentProject, updateProjectSettings, regenerateSecrets } = useProjectStore();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const policyPacks = [
    {
      id: 'pack_financial',
      name: 'Strict Financial Compliance (SOX / PCI)',
      description: 'Enforces mandatory PII redaction, 0% toxicity, strict tool authorization, and audit logs for all payloads.',
      controlsCount: 8,
    },
    {
      id: 'pack_support',
      name: 'Customer Support Permissive',
      description: 'Permits standard knowledge base lookup tools while redacting sensitive customer SSN/email credentials.',
      controlsCount: 5,
    },
    {
      id: 'pack_enterprise',
      name: 'Internal Enterprise Operations',
      description: 'Optimized for high-volume developer AI tools with Firecracker Micro-VM sandbox execution enforcing zero network egress.',
      controlsCount: 6,
    },
  ];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6 text-slate-100">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <FolderPlus className="w-6 h-6 text-cyan-400" /> Multi-Tenant Project Initialization & Gateway Setup
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure tenant boundary isolation, LiteLLM gateway ingestion hooks, Langfuse telemetry sync, and default guardrail packs.
        </p>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-4 gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
        {[
          { step: 1, title: '1. Identity & Metadata', icon: Shield },
          { step: 2, title: '2. Gateway Hook Config', icon: Key },
          { step: 3, title: '3. Observability Sync', icon: Eye },
          { step: 4, title: '4. Baseline Policy Pack', icon: Sliders },
        ].map((s) => {
          const Icon = s.icon;
          const active = currentStep === s.step;
          const completed = currentStep > s.step;

          return (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`flex items-center gap-2.5 p-3 rounded-lg text-xs font-semibold transition-all border text-left ${
                active
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                  : completed
                  ? 'bg-slate-900 border-slate-800 text-emerald-400'
                  : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              <div
                className={`p-1.5 rounded ${
                  active
                    ? 'bg-cyan-500 text-slate-950'
                    : completed
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {completed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div>
                <div>{s.title}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
        {/* STEP 1: Identity & Metadata */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Multi-Tenant Boundary & Identity Metadata
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Project Name</label>
                <input
                  type="text"
                  value={currentProject.name}
                  onChange={(e) => updateProjectSettings({ name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Cost Center Tag</label>
                <input
                  type="text"
                  value={currentProject.costCenterTag}
                  onChange={(e) => updateProjectSettings({ costCenterTag: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Environment Tagging</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['dev', 'staging', 'prod'] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => updateProjectSettings({ environment: env })}
                      className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                        currentProject.environment === env
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {env} Environment
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Gateway Hook Config */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" /> LiteLLM Gateway Hook Binding & Secrets
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">LiteLLM Gateway Endpoint URL</label>
                <input
                  type="text"
                  value={currentProject.gatewayEndpoint}
                  onChange={(e) => updateProjectSettings({ gatewayEndpoint: e.target.value })}
                  className="w-full bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-700 rounded-lg px-3 py-2 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Generated pre_call_hook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentProject.preCallHookUrl}
                    className="flex-1 bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-lg px-3 py-2"
                  />
                  <button
                    onClick={() => handleCopy(currentProject.preCallHookUrl, 'hook')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 font-medium"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copiedField === 'hook' ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-300">Gateway Webhook Secret</label>
                  <button
                    onClick={regenerateSecrets}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate Secret
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={currentProject.webhookSecret}
                  className="w-full bg-slate-950 font-mono text-xs text-amber-300 border border-slate-800 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Observability Sync */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" /> Langfuse Telemetry & Shadow Evaluation Sync
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Langfuse Host URL</label>
                  <input
                    type="text"
                    value={currentProject.langfuseHost}
                    onChange={(e) => updateProjectSettings({ langfuseHost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Langfuse Public Key</label>
                  <input
                    type="text"
                    value={currentProject.langfusePublicKey}
                    onChange={(e) => updateProjectSettings({ langfusePublicKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shadow Evaluation Toggle */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Dark Traffic / Shadow Pipeline Evaluation</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Asynchronously mirrors live gateway traffic through experimental guardrail DAGs without impacting production latency.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateProjectSettings({ shadowEvaluationMode: !currentProject.shadowEvaluationMode })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    currentProject.shadowEvaluationMode ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md"></span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Policy Pack */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> Default Guardrail Baseline Policy Pack
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {policyPacks.map((pack) => {
                const selected = currentProject.selectedPolicyPack === pack.name;
                return (
                  <div
                    key={pack.id}
                    onClick={() => updateProjectSettings({ selectedPolicyPack: pack.name })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 flex flex-col justify-between ${
                      selected
                        ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300">{pack.name}</span>
                        {selected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{pack.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{pack.controlsCount} Controls Pre-Wired</span>
                      <span className="text-emerald-400">Ready to Deploy</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stepper Control Buttons */}
        <div className="pt-4 border-t border-slate-800 flex justify-between">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 transition-colors"
            >
              Next Step <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => alert('Project Setup Saved Successfully!')}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-xs flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950"
            >
              <CheckCircle2 className="w-4 h-4" /> Deploy Project Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
