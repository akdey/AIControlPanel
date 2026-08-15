import React, { useState } from 'react';
import { X, FolderPlus, Shield } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { updateProjectSettings } = useProjectStore();
  const [name, setName] = useState('');
  const [costCenter, setCostCenter] = useState('CC-9021-FINTECH');
  const [env, setEnv] = useState<'dev' | 'staging' | 'prod'>('prod');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProjectSettings({
      id: `proj_${Date.now().toString().slice(-4)}`,
      name,
      costCenterTag: costCenter,
      environment: env,
    });
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Create New Workspace / Project</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Workspace Name</label>
            <input
              type="text"
              required
              placeholder="e.g., Risk Analytics Gateway"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Cost Center Tag</label>
            <input
              type="text"
              required
              value={costCenter}
              onChange={(e) => setCostCenter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">Environment Tag</label>
            <div className="grid grid-cols-3 gap-2">
              {(['dev', 'staging', 'prod'] as const).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEnv(e)}
                  className={`py-1.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                    env === e
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
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
              <FolderPlus className="w-3.5 h-3.5" /> Initialize Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
