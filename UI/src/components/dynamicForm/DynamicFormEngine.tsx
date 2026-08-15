import React, { useState } from 'react';
import type { UIForm, UIFormField, DynamicRuleCondition } from '../../types/controls';
import { PORT_TYPE_METADATA } from '../../helpers/isValidConnection';
import { Plus, Trash2, Code2, Sliders, Shield, Layers } from 'lucide-react';

interface DynamicFormEngineProps {
  uiForm: UIForm;
  values: Record<string, any>;
  onChange: (newValues: Record<string, any>, dynamicPorts?: any[]) => void;
}

export const DynamicFormEngine: React.FC<DynamicFormEngineProps> = ({ uiForm, values, onChange }) => {
  const handleFieldChange = (fieldName: string, value: any) => {
    const updated = { ...values, [fieldName]: value };
    onChange(updated);
  };

  const renderField = (field: UIFormField) => {
    const currentValue = values[field.name] !== undefined ? values[field.name] : field.defaultValue;

    switch (field.type) {
      case 'text_input':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {field.label} {field.required && <span className="text-rose-400">*</span>}
            </label>
            <input
              type="text"
              value={currentValue || ''}
              placeholder={field.placeholder}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {field.helperText && <p className="text-[11px] text-slate-400">{field.helperText}</p>}
          </div>
        );

      case 'number_input':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {field.label}
            </label>
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={field.step || 1}
              value={currentValue !== undefined ? currentValue : ''}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {field.helperText && <p className="text-[11px] text-slate-400">{field.helperText}</p>}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.name} className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {field.label}
            </label>
            <select
              value={currentValue || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              {(field.options || []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {field.helperText && <p className="text-[11px] text-slate-400">{field.helperText}</p>}
          </div>
        );

      case 'radio_group':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {field.label}
            </label>
            <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              {(field.options || []).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all ${
                    currentValue === opt.value
                      ? 'bg-cyan-950/40 border border-cyan-500/50 text-cyan-200'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={opt.value}
                    checked={currentValue === opt.value}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="accent-cyan-500 text-cyan-500"
                  />
                  <span className="text-xs font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
            {field.helperText && <p className="text-[11px] text-slate-400">{field.helperText}</p>}
          </div>
        );

      case 'multi_select': {
        const selectedList: string[] = Array.isArray(currentValue) ? currentValue : [];
        const toggleOption = (val: string) => {
          const updated = selectedList.includes(val)
            ? selectedList.filter((item) => item !== val)
            : [...selectedList, val];
          handleFieldChange(field.name, updated);
        };

        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {field.label} ({selectedList.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
              {(field.options || []).map((opt) => {
                const checked = selectedList.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all border ${
                      checked
                        ? 'bg-blue-950/60 border-blue-500/60 text-blue-300 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {checked && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-1"></span>}
                  </button>
                );
              })}
            </div>
            {field.helperText && <p className="text-[11px] text-slate-400">{field.helperText}</p>}
          </div>
        );
      }

      case 'slider': {
        const val = currentValue !== undefined ? currentValue : field.min || 0;
        return (
          <div key={field.name} className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                {field.label}
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                {val}
              </span>
            </div>
            <input
              type="range"
              min={field.min || 0}
              max={field.max || 1}
              step={field.step || 0.01}
              value={val}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            {field.helperText && <p className="text-[11px] text-slate-400">{field.helperText}</p>}
          </div>
        );
      }

      case 'toggle': {
        const checked = !!currentValue;
        return (
          <div
            key={field.name}
            className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-800"
          >
            <div>
              <label className="text-xs font-semibold text-slate-300 block">{field.label}</label>
              {field.helperText && <p className="text-[11px] text-slate-400 mt-0.5">{field.helperText}</p>}
            </div>
            <button
              type="button"
              onClick={() => handleFieldChange(field.name, !checked)}
              className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors ${
                checked ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white shadow-md"></span>
            </button>
          </div>
        );
      }

      case 'tag_input': {
        const tagList: string[] = Array.isArray(currentValue) ? currentValue : [];
        const [inputValue, setInputValue] = useState('');

        const addTag = () => {
          if (!inputValue.trim()) return;
          if (!tagList.includes(inputValue.trim())) {
            handleFieldChange(field.name, [...tagList, inputValue.trim()]);
          }
          setInputValue('');
        };

        const removeTag = (tagToRemove: string) => {
          handleFieldChange(
            field.name,
            tagList.filter((t) => t !== tagToRemove)
          );
        };

        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {field.label}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                placeholder={field.placeholder || 'Type and press Add...'}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-md px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-md border border-slate-700 flex items-center gap-1 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-slate-900 border border-slate-700/80 text-cyan-300 text-[11px] px-2 py-1 rounded font-mono"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        );
      }

      case 'code_editor':
        return (
          <div key={field.name} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                {field.label}
              </label>
              <span className="text-[10px] uppercase font-mono bg-indigo-950/80 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/60 font-bold">
                {field.language || 'code'}
              </span>
            </div>
            
            {/* Editor Window Container */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
              <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[10px] font-mono text-slate-400 ml-2">policy.rego</span>
                </div>
                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-900">
                  OPA Policy v1
                </span>
              </div>
              <textarea
                rows={7}
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full font-mono text-xs bg-slate-950 p-3 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed shadow-inner resize-y custom-scrollbar"
                spellCheck={false}
              />
            </div>
            {field.helperText && <p className="text-[11px] text-slate-400">{field.helperText}</p>}
          </div>
        );

      case 'dynamic_rule_builder': {
        const rulesList: DynamicRuleCondition[] = Array.isArray(currentValue) ? currentValue : [];

        const updateRule = (idx: number, updatedFields: Partial<DynamicRuleCondition>) => {
          const newRules = rulesList.map((r, i) => (i === idx ? { ...r, ...updatedFields } : r));
          
          const dynamicPorts = newRules.map((r) => ({
            id: r.portIdentifier,
            label: r.portLabel,
            type: r.outputType,
          }));

          onChange({ ...values, [field.name]: newRules }, dynamicPorts);
        };

        const addRule = () => {
          const id = `port_branch_${Date.now().toString().slice(-4)}`;
          const newRule: DynamicRuleCondition = {
            portIdentifier: id,
            portLabel: 'New Branch Condition',
            outputType: 'prompt_object',
            condition: { '==': [{ var: 'metadata.status' }, 'ok'] },
          };
          const newRules = [...rulesList, newRule];
          const dynamicPorts = newRules.map((r) => ({
            id: r.portIdentifier,
            label: r.portLabel,
            type: r.outputType,
          }));
          onChange({ ...values, [field.name]: newRules }, dynamicPorts);
        };

        const removeRule = (idx: number) => {
          const newRules = rulesList.filter((_, i) => i !== idx);
          const dynamicPorts = newRules.map((r) => ({
            id: r.portIdentifier,
            label: r.portLabel,
            type: r.outputType,
          }));
          onChange({ ...values, [field.name]: newRules }, dynamicPorts);
        };

        return (
          <div key={field.name} className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                {field.label} ({rulesList.length} branches)
              </label>
              <button
                type="button"
                onClick={addRule}
                className="bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Add Branch Port
              </button>
            </div>

            <div className="space-y-2.5">
              {rulesList.map((rule, idx) => {
                return (
                  <div
                    key={rule.portIdentifier || idx}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={rule.portLabel}
                        onChange={(e) => updateRule(idx, { portLabel: e.target.value })}
                        className="bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded px-2 py-1 flex-1 font-medium"
                        placeholder="Branch Label"
                      />
                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Port Output Type</label>
                        <select
                          value={rule.outputType}
                          onChange={(e) => updateRule(idx, { outputType: e.target.value as any })}
                          className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1"
                        >
                          {Object.keys(PORT_TYPE_METADATA).map((t) => (
                            <option key={t} value={t}>
                              {PORT_TYPE_METADATA[t as keyof typeof PORT_TYPE_METADATA].label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">JSONLogic Expression</label>
                        <input
                          type="text"
                          value={JSON.stringify(rule.condition || {})}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              updateRule(idx, { condition: parsed });
                            } catch (err) {
                              // keep raw string if editing
                            }
                          }}
                          className="w-full bg-slate-950 font-mono border border-slate-800 text-[11px] text-amber-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'group': {
        const groupValues = currentValue || {};

        return (
          <div key={field.name} className="bg-slate-900/80 border border-slate-800/90 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              {field.label}
            </h4>
            <div className="space-y-3 pl-1">
              {(field.fields || []).map((subField) => (
                <div key={subField.name}>
                  {renderField({
                    ...subField,
                    defaultValue: groupValues[subField.name] ?? subField.defaultValue,
                    name: subField.name,
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {uiForm.fields.map((field) => (
        <div key={field.name}>{renderField(field)}</div>
      ))}
    </div>
  );
};
