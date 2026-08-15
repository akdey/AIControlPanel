import React from 'react';
import { useProjectStore } from '../store/projectStore';
import {
  FolderKanban,
  Plus,
  Key,
  Shield,
  Eye,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Copy,
} from 'lucide-react';

interface ProjectsOverviewViewProps {
  onSelectProject: (projectId: string) => void;
  openCreateProjectModal: () => void;
  navigateToCanvas: () => void;
}

export const ProjectsOverviewView: React.FC<ProjectsOverviewViewProps> = ({
  openCreateProjectModal,
  navigateToCanvas,
}) => {
  const { currentProject } = useProjectStore();

  const projects = [
    {
      id: currentProject.id,
      name: currentProject.name,
      environment: currentProject.environment,
      costCenter: currentProject.costCenterTag,
      agentsCount: 3,
      pipelinesCount: 2,
      gateway: currentProject.gatewayEndpoint,
      policyPack: currentProject.selectedPolicyPack,
      status: 'Active',
    },
    {
      id: 'proj_insurance_sandbox',
      name: 'Insurance Claims Sandbox',
      environment: 'staging' as const,
      costCenter: 'CC-4012-INSURE',
      agentsCount: 2,
      pipelinesCount: 1,
      gateway: 'https://gateway.insurance.internal/v1',
      policyPack: 'Customer Support Permissive',
      status: 'Active',
    },
    {
      id: 'proj_dev_sandbox',
      name: 'Developer Tooling Sandbox',
      environment: 'dev' as const,
      costCenter: 'CC-1029-DEV',
      agentsCount: 4,
      pipelinesCount: 3,
      gateway: 'https://gateway.dev.internal/v1',
      policyPack: 'Internal Enterprise Operations',
      status: 'Active',
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-indigo-400" /> Multi-Tenant Projects & Workspaces Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage boundary workspaces, gateway pre-call hooks, observability API bindings, and agent pipeline DAGs.
          </p>
        </div>

        <button
          onClick={openCreateProjectModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-indigo-950"
        >
          <Plus className="w-4 h-4" /> Create New Workspace
        </button>
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.id}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <span className="font-mono text-[11px] text-slate-400">ID: {p.id}</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
                  {p.environment}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Cost Center:</span>
                  <span className="text-slate-200">{p.costCenter}</span>
                </div>
                <div className="flex justify-between text-slate-400 truncate">
                  <span>Gateway:</span>
                  <span className="text-indigo-400 truncate max-w-[150px]">{p.gateway}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">
                  Active Baseline Policy Pack
                </span>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" /> {p.policyPack}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400 font-mono">
                <span>{p.agentsCount} Agents</span> · <span>{p.pipelinesCount} Pipelines</span>
              </div>

              <button
                onClick={navigateToCanvas}
                className="bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-semibold flex items-center gap-1 transition-colors"
              >
                Open Canvas DAG <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
