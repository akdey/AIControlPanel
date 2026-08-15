import React, { useState } from 'react';
import { X, PlusCircle, LayoutDashboard, Shield } from 'lucide-react';

interface CreateDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dashboardName: string, category: string) => void;
}

export const CreateDashboardModal: React.FC<CreateDashboardModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('executive');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name, category);
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Create New Custom Dashboard</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Dashboard Title</label>
            <input
              type="text"
              required
              placeholder="e.g., Customer Support Fleet Metrics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Category Focus</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="executive">Executive & SLA Overview</option>
              <option value="customer">Customer / Tenant Specific</option>
              <option value="security">Security & Guardrail Interceptions</option>
              <option value="finops">FinOps & Budget Forecast</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-950 flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
