import React, { useState } from 'react';
import { Plus, Trash2, X, Sliders, CheckCircle, ShieldAlert } from 'lucide-react';

export interface ConditionRule {
  source_node_id: string;
  field_path: string;
  operator: string;
  value: string;
}

export interface DynamicRuleConfig {
  logic: 'AND' | 'OR';
  action_on_match: 'BLOCK' | 'REDACT' | 'ROUTE';
  rules: ConditionRule[];
  on_true_handle?: string;
  on_false_handle?: string;
}

interface UpstreamNodeOption {
  id: string;
  label: string;
  outputFields: string[];
}

interface RuleBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeLabel: string;
  initialConfig?: DynamicRuleConfig;
  upstreamNodes: UpstreamNodeOption[];
  onSave: (config: DynamicRuleConfig) => void;
}

export const RuleBuilderDrawer: React.FC<RuleBuilderDrawerProps> = ({
  isOpen,
  onClose,
  nodeId,
  nodeLabel,
  initialConfig,
  upstreamNodes,
  onSave,
}) => {
  const [logic, setLogic] = useState<'AND' | 'OR'>(initialConfig?.logic || 'AND');
  const [action, setAction] = useState<'BLOCK' | 'REDACT' | 'ROUTE'>(initialConfig?.action_on_match || 'BLOCK');
  const [rules, setRules] = useState<ConditionRule[]>(
    initialConfig?.rules?.length
      ? initialConfig.rules
      : [{ source_node_id: '', field_path: '', operator: '==', value: '' }]
  );

  if (!isOpen) return null;

  const addRule = () => {
    setRules([
      ...rules,
      { source_node_id: '', field_path: '', operator: '==', value: '' }
    ]);
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index));
    }
  };

  const updateRule = (index: number, key: keyof ConditionRule, val: string) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [key]: val };
    setRules(updated);
  };

  const handleSave = () => {
    onSave({
      logic,
      action_on_match: action,
      rules: rules.filter(r => r.source_node_id && r.field_path)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Dynamic Rule Evaluator Configuration</h2>
              <p className="text-xs text-slate-400">Node: {nodeLabel} ({nodeId})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Logic Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rule Logic Condition</label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setLogic('AND')}
                className={`py-2.5 px-4 rounded-lg text-xs font-semibold transition ${
                  logic === 'AND'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Match ALL Conditions (AND)
              </button>
              <button
                type="button"
                onClick={() => setLogic('OR')}
                className={`py-2.5 px-4 rounded-lg text-xs font-semibold transition ${
                  logic === 'OR'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Match ANY Condition (OR)
              </button>
            </div>
          </div>

          {/* Dynamic Condition Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Evaluation Rules ({rules.length})
              </label>
            </div>

            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const selectedNode = upstreamNodes.find(n => n.id === rule.source_node_id);
                const fieldOptions = selectedNode?.outputFields || [
                  'status',
                  'action_taken',
                  'metadata.score',
                  'metadata.pii_entities',
                  'duration_ms'
                ];

                return (
                  <div
                    key={idx}
                    className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    {/* Source Node Select */}
                    <select
                      value={rule.source_node_id}
                      onChange={(e) => updateRule(idx, 'source_node_id', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Select Source Node --</option>
                      {upstreamNodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.label} ({n.id})
                        </option>
                      ))}
                    </select>

                    {/* Output Field Select / Input */}
                    <select
                      value={rule.field_path}
                      onChange={(e) => updateRule(idx, 'field_path', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 text-xs rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Select Field Path --</option>
                      {fieldOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(idx, 'operator', e.target.value)}
                      className="w-28 bg-slate-900 border border-slate-700 text-xs rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="==">== (Equals)</option>
                      <option value="!=">!= (Not Equal)</option>
                      <option value=">">&gt; (Greater)</option>
                      <option value=">=">&gt;= (Greater/Eq)</option>
                      <option value="<">&lt; (Less)</option>
                      <option value="<=">&lt;= (Less/Eq)</option>
                      <option value="contains">contains</option>
                      <option value="not_contains">not contains</option>
                    </select>

                    {/* Target Value Input */}
                    <input
                      type="text"
                      placeholder="Target Value..."
                      value={rule.value}
                      onChange={(e) => updateRule(idx, 'value', e.target.value)}
                      className="w-32 bg-slate-900 border border-slate-700 text-xs rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />

                    {/* Delete Rule */}
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      disabled={rules.length <= 1}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30 disabled:hover:text-slate-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Rule Button */}
            <button
              type="button"
              onClick={addRule}
              className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition pt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Condition Rule</span>
            </button>
          </div>

          {/* Action Config */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Action On Match</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 text-xs rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="BLOCK">Halt Pipeline & Block Request (BLOCK)</option>
              <option value="REDACT">Flag Content & Redact Payload (REDACT)</option>
              <option value="ROUTE">Route to High-Risk Decision Port (ROUTE)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
