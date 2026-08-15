import React, { useState, useMemo } from 'react';
import projectsData from '../data/projectsData.json';
import { 
  FolderKanban, 
  Bot, 
  Plus, 
  GitFork, 
  X, 
  Search, 
  Filter, 
  ArrowLeft,
  ChevronRight,
  MoreVertical,
  Activity
} from 'lucide-react';
import { PipelineStudioView } from './PipelineStudioView';

interface ProjectsViewProps {
  filterMode: 'all' | 'pre-published' | 'published' | 'agents';
}

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: string;
  environment: string;
  agents: AgentItem[];
}

interface AgentItem {
  id: string;
  name: string;
  model: string;
  status: string;
  hasPipeline: boolean;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ filterMode }) => {
  const [projects, setProjects] = useState<ProjectItem[]>(projectsData as ProjectItem[]);
  
  // High-level navigation state
  const [activeFlowStep, setActiveFlowStep] = useState<null | 'create_project' | 'open_canvas'>(null);
  
  // Project Detail state
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  
  // Modals inside project detail
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);
  const [agentForCanvas, setAgentForCanvas] = useState<AgentItem | null>(null);

  // Projects List Filters & Sort
  const [projectSearch, setProjectSearch] = useState('');
  const [envFilter, setEnvFilter] = useState('ALL');
  const [projectSort, setProjectSort] = useState<'name' | 'agents'>('name');

  // Agent List Filters
  const [agentSearch, setAgentSearch] = useState('');

  // Forms
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjEnv, setNewProjEnv] = useState('DEV');

  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('gpt-4o-mini');

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const createdProj: ProjectItem = {
      id: `proj_${Date.now().toString().slice(-4)}`,
      name: newProjName,
      description: newProjDesc || 'Custom enterprise workspace boundary.',
      status: 'pre-published',
      environment: newProjEnv,
      agents: [],
    };

    setProjects((prev) => [createdProj, ...prev]);
    setSelectedProject(createdProj);
    setNewProjName('');
    setNewProjDesc('');
    setActiveFlowStep(null);
  };

  const handleCreateAgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !selectedProject) return;

    const createdAgent: AgentItem = {
      id: `agt_${Date.now().toString().slice(-4)}`,
      name: newAgentName,
      model: newAgentModel,
      status: 'draft',
      hasPipeline: false,
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === selectedProject.id ? { ...p, agents: [...p.agents, createdAgent] } : p))
    );
    
    // Update local selected project so UI refreshes immediately
    setSelectedProject((prev) => prev ? { ...prev, agents: [...prev.agents, createdAgent] } : null);

    setNewAgentName('');
    setIsCreateAgentOpen(false);
  };

  // Memoized Filtering & Sorting for Projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) => {
      // 1. Global Filter mode from props (if any logic tied to route)
      if (filterMode === 'pre-published' && p.status !== 'pre-published') return false;
      if (filterMode === 'published' && p.status !== 'published') return false;
      
      // 2. Local Search filter
      if (projectSearch) {
        const query = projectSearch.toLowerCase();
        if (!p.name.toLowerCase().includes(query) && !p.description.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 3. Environment Filter
      if (envFilter !== 'ALL' && p.environment !== envFilter) return false;

      return true;
    });

    // 4. Sorting
    result.sort((a, b) => {
      if (projectSort === 'name') {
        return a.name.localeCompare(b.name);
      } else if (projectSort === 'agents') {
        return b.agents.length - a.agents.length;
      }
      return 0;
    });

    return result;
  }, [projects, filterMode, projectSearch, envFilter, projectSort]);

  // -----------------------------------------
  // PIPELINE STUDIO VIEW
  // -----------------------------------------
  if (activeFlowStep === 'open_canvas') {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] w-full overflow-hidden relative rounded-xl border app-border">
        <div className="app-card border-b px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-cyan-500 font-bold">Pipeline Canvas:</span>
            <span className="app-text-muted">Agent</span>
            <span className="app-text-subtle">/</span>
            <span className="font-bold">{agentForCanvas?.name}</span>
          </div>

          <button
            onClick={() => {
              setActiveFlowStep(null);
              setAgentForCanvas(null);
            }}
            className="app-surface hover:border-cyan-500 border px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Project
          </button>
        </div>
        <div className="flex-1 h-full w-full relative overflow-hidden">
          <PipelineStudioView />
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // PROJECT DETAIL VIEW
  // -----------------------------------------
  if (selectedProject) {
    // Current project object from main state to ensure reactivity
    const currentProject = projects.find(p => p.id === selectedProject.id) || selectedProject;
    
    const filteredAgents = currentProject.agents.filter(a => 
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.model.toLowerCase().includes(agentSearch.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Detail Header */}
        <div className="flex items-center justify-between pb-4 border-b app-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedProject(null)}
              className="p-1.5 app-surface border rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-extrabold tracking-tight">{currentProject.name}</h1>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    currentProject.environment === 'PROD'
                      ? 'bg-red-500/10 text-red-500 border-red-500/30'
                      : currentProject.environment === 'STAGING'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  }`}
                >
                  {currentProject.environment}
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    currentProject.status === 'published'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                  }`}
                >
                  {currentProject.status}
                </span>
              </div>
              <p className="text-xs app-text-muted mt-1">{currentProject.description}</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsCreateAgentOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-md flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Agent
          </button>
        </div>

        {/* Create Agent Modal/Section */}
        {isCreateAgentOpen && (
          <div className="app-card border border-blue-500 p-5 rounded-lg space-y-4 shadow-xl mb-6">
            <div className="flex items-center justify-between border-b app-border pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-500"/> Create New Agent
              </h3>
              <button onClick={() => setIsCreateAgentOpen(false)} className="app-text-muted hover:text-blue-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAgentSubmit} className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="text-xs font-semibold app-text-muted block">Agent Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fraud Investigation Agent"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold app-text-muted block">Base Foundation Model</label>
                <select
                  value={newAgentModel}
                  onChange={(e) => setNewAgentModel(e.target.value)}
                  className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="gpt-4o-mini">OpenAI gpt-4o-mini (Fast SLM)</option>
                  <option value="gpt-4o">OpenAI gpt-4o (Reasoning)</option>
                  <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAgentOpen(false)}
                  className="px-3 py-1.5 app-surface border text-xs rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Agents List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-500" /> Agents ({filteredAgents.length})
            </h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 app-text-muted" />
              <input 
                type="text"
                placeholder="Search agents..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs app-surface border rounded-md focus:outline-none focus:border-blue-500 w-64"
              />
            </div>
          </div>

          <div className="border app-border rounded-lg overflow-hidden app-card">
            <table className="w-full text-left text-xs">
              <thead className="app-surface border-b app-border text-xs font-semibold app-text-muted">
                <tr>
                  <th className="px-4 py-3">Agent Name</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pipeline</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y app-divide">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center app-text-muted">
                      No agents found in this project.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map(agt => (
                    <tr key={agt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{agt.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {agt.model}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                            agt.status === 'active'
                              ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-900/20'
                              : 'text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-900/50 dark:bg-amber-900/20'
                          }`}
                        >
                          {agt.status === 'active' && <Activity className="w-3 h-3" />}
                          {agt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {agt.hasPipeline ? (
                          <span className="text-emerald-500 font-medium">Configured</span>
                        ) : (
                          <span className="app-text-muted">Unconfigured</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setAgentForCanvas(agt);
                            setActiveFlowStep('open_canvas');
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] px-3 py-1.5 rounded inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <GitFork className="w-3 h-3" /> DAG Studio
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // PROJECTS LIST VIEW (ALL PROJECTS)
  // -----------------------------------------

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b app-border pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-500" /> Projects Directory
          </h1>
          <p className="text-xs app-text-muted mt-1">
            Manage boundary workspaces and agents across all environments.
          </p>
        </div>

        <button
          onClick={() => setActiveFlowStep('create_project')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-md flex items-center gap-1.5 shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" /> Create Project
        </button>
      </div>

      {/* Create Project Modal/Section */}
      {activeFlowStep === 'create_project' && (
        <div className="app-card border border-blue-500 p-5 rounded-lg space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <div className="flex items-center justify-between border-b app-border pb-3">
            <h3 className="text-sm font-bold">Create New Project</h3>
            <button onClick={() => setActiveFlowStep(null)} className="app-text-muted hover:text-blue-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateProjectSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2 md:col-span-1">
                <label className="text-xs font-semibold app-text-muted block">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Risk Analytics Agent Workspace"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1 col-span-2 md:col-span-1">
                <label className="text-xs font-semibold app-text-muted block">Environment</label>
                <select
                  value={newProjEnv}
                  onChange={(e) => setNewProjEnv(e.target.value)}
                  className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="DEV">Development</option>
                  <option value="STAGING">Staging</option>
                  <option value="PROD">Production</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold app-text-muted block">Description</label>
              <textarea
                placeholder="Governance scope and guardrails description..."
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 h-20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveFlowStep(null)}
                className="px-4 py-1.5 app-surface border text-xs rounded font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded flex items-center gap-1"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border app-border">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 app-text-muted" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm app-surface border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 app-text-muted" />
            <select 
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="text-sm app-surface border rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Environments</option>
              <option value="PROD">PROD</option>
              <option value="STAGING">STAGING</option>
              <option value="DEV">DEV</option>
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold app-text-muted">Sort:</span>
            <select 
              value={projectSort}
              onChange={(e) => setProjectSort(e.target.value as 'name' | 'agents')}
              className="text-sm app-surface border rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="name">Alphabetical</option>
              <option value="agents">Agent Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full p-8 text-center app-card border rounded-xl border-dashed">
            <p className="app-text-muted">No projects found matching the criteria.</p>
          </div>
        ) : (
          filteredProjects.map((p) => (
            <div 
              key={p.id} 
              onClick={() => setSelectedProject(p)}
              className="group app-card border p-5 rounded-xl space-y-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 pr-2">
                    <h3 className="text-base font-bold group-hover:text-blue-500 transition-colors line-clamp-1">{p.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          p.environment === 'PROD'
                            ? 'bg-red-500/10 text-red-500 border-red-500/30'
                            : p.environment === 'STAGING'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                        }`}
                      >
                        {p.environment}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                          p.status === 'published'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs app-text-muted line-clamp-2 min-h-[32px]">{p.description}</p>
              </div>

              <div className="pt-4 border-t app-border flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold app-text-subtle">
                  <Bot className="w-4 h-4" />
                  {p.agents.length} {p.agents.length === 1 ? 'Agent' : 'Agents'}
                </div>
                <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-xs font-bold gap-1">
                  Manage <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
