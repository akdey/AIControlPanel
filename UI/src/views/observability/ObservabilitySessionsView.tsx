import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { observabilityApi } from '../../api';
import { 
  Activity, 
  Search, 
  Filter, 
  X, 
  ChevronRight,
  ChevronDown,
  Server,
  Cloud,
  Bot,
  Clock,
  DollarSign,
  Cpu,
  AlignLeft,
  Wrench,
  Database,
  Network
} from 'lucide-react';

interface SessionMetadata {
  vmInstance: string;
  appService: string;
  agentHost: string;
}

interface SessionMetrics {
  totalTraces: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
}

interface Session {
  id: string;
  createdAt: string;
  projectId: string;
  traces: string[];
  metrics: SessionMetrics;
  metadata: SessionMetadata;
}

interface TraceUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface Trace {
  id: string;
  timestamp: string;
  name: string;
  type: string;
  sessionId: string;
  userId: string;
  parentObservationId: string | null;
  input: any;
  output: any;
  metadata: any;
  tags: string[];
  usage: TraceUsage;
  cost: number;
  latency: number;
}

interface TraceNode extends Trace {
  children: TraceNode[];
}

// -------------------------------------------------------------
// Recursive Tree Node Component
// -------------------------------------------------------------
const TraceTreeNode: React.FC<{ node: TraceNode; level?: number }> = ({ node, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  // Determine Icon based on Type
  let TypeIcon = Network;
  let typeColor = "text-blue-500";
  if (node.type === 'generation') { TypeIcon = Bot; typeColor = "text-emerald-500"; }
  if (node.type === 'retrieval') { TypeIcon = Database; typeColor = "text-amber-500"; }
  if (node.type === 'tool') { TypeIcon = Wrench; typeColor = "text-rose-500"; }
  if (node.type === 'span') { TypeIcon = AlignLeft; typeColor = "text-blue-500"; }

  return (
    <div className="w-full mb-3">
      {/* Node Card */}
      <div className={`border app-border rounded-lg app-card shadow-sm transition-colors ${isExpanded ? 'border-blue-500/30' : 'hover:border-blue-500/50'}`}>
        
        {/* Header / Toggle Row */}
        <div 
          className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-2 p-3 ${isExpanded ? 'border-b app-border app-surface rounded-t-lg' : ''} ${hasChildren ? 'cursor-pointer' : ''}`}
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {/* Expander Icon */}
            <div className="w-5 flex justify-center">
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-4 h-4 app-text-muted" /> : <ChevronRight className="w-4 h-4 app-text-muted" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-subtle)]" />
              )}
            </div>

            <TypeIcon className={`w-4 h-4 ${typeColor}`} />
            <span className="font-bold text-sm">{node.name}</span>
            <span className="text-[10px] font-mono app-text-muted hidden md:inline-block">({node.type})</span>
          </div>

          <div className="text-right flex items-center gap-3 text-[11px] font-mono font-bold pl-8 md:pl-0">
            <span className="text-emerald-500">{node.latency}s</span>
            <span className="text-amber-500">${(node.cost || 0).toFixed(4)}</span>
            <span className="text-blue-500">{node.usage?.totalTokens || 0} tkns</span>
          </div>
        </div>

        {/* Node Details (I/O) */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold app-text-muted uppercase">Input Payload</span>
                <div className="app-surface p-2.5 rounded border app-border text-[10px] font-mono overflow-x-auto text-emerald-600 dark:text-emerald-400 max-h-40">
                  <pre>{JSON.stringify(node.input, null, 2)}</pre>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold app-text-muted uppercase">Output Result</span>
                <div className="app-surface p-2.5 rounded border app-border text-[10px] font-mono overflow-x-auto text-blue-600 dark:text-blue-400 max-h-40">
                  <pre>{JSON.stringify(node.output, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Children Container */}
      {hasChildren && isExpanded && (
        <div className="ml-5 mt-3 pl-4 border-l-2 app-border">
          {node.children.map(child => (
            <TraceTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};


// -------------------------------------------------------------
// Main View Component
// -------------------------------------------------------------
export const ObservabilitySessionsView: React.FC = () => {
  // Fetch Data via API
  const { data: rawSessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: observabilityApi.getSessions,
  });

  const { data: rawTracesData, isLoading: tracesLoading } = useQuery({
    queryKey: ['traces'],
    queryFn: observabilityApi.getTraces,
  });

  const sessions = (rawSessionsData || []) as Session[];
  const traces = (rawTracesData || []) as Trace[];

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [vmFilter, setVmFilter] = useState('ALL');
  const [appFilter, setAppFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');

  // Selected Session for Trace Drawer
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Derived Filter Options
  const uniqueVms = Array.from(new Set(sessions.map(s => s.metadata?.vmInstance).filter(Boolean)));
  const uniqueApps = Array.from(new Set(sessions.map(s => s.metadata?.appService).filter(Boolean)));
  const uniqueAgents = Array.from(new Set(sessions.map(s => s.metadata?.agentHost).filter(Boolean)));

  // Memoized Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (searchTerm && !s.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (vmFilter !== 'ALL' && s.metadata?.vmInstance !== vmFilter) return false;
      if (appFilter !== 'ALL' && s.metadata?.appService !== appFilter) return false;
      if (agentFilter !== 'ALL' && s.metadata?.agentHost !== agentFilter) return false;
      return true;
    });
  }, [sessions, searchTerm, vmFilter, appFilter, agentFilter]);

  // Derived Traces Tree for Selected Session
  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const sessionTraceRoots = useMemo(() => {
    if (!selectedSessionId) return [];
    
    const sessionTraces = traces.filter(t => t.sessionId === selectedSessionId);
    
    // Build lookup map for fast child mapping
    const nodeMap = new Map<string, TraceNode>();
    sessionTraces.forEach(t => {
      nodeMap.set(t.id, { ...t, children: [] });
    });

    const roots: TraceNode[] = [];
    
    // Construct tree
    nodeMap.forEach(node => {
      if (node.parentObservationId && nodeMap.has(node.parentObservationId)) {
        nodeMap.get(node.parentObservationId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    
    // Sort roots by timestamp
    roots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Optionally sort children by timestamp recursively
    const sortChildren = (node: TraceNode) => {
      node.children.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      node.children.forEach(sortChildren);
    };
    roots.forEach(sortChildren);

    return roots;
  }, [traces, selectedSessionId]);

  if (sessionsLoading || tracesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
          <div className="text-sm font-mono app-text-muted animate-pulse">Loading telemetry data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b app-border pb-4 gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Observability — Sessions
          </h1>
          <p className="text-xs app-text-muted mt-1">
            Monitor and trace multi-agent execution sessions across all environments.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 app-surface p-3 rounded-lg border app-border">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 app-text-muted" />
          <input 
            type="text" 
            placeholder="Search Session ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm app-surface border rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 app-text-muted" />
            <select 
              value={vmFilter}
              onChange={(e) => setVmFilter(e.target.value)}
              className="text-xs app-surface border rounded-md px-2 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All VMs</option>
              {uniqueVms.map(vm => <option key={vm} value={vm}>{vm}</option>)}
            </select>
          </div>
          <div className="w-px h-5 bg-[var(--border-card)] hidden md:block"></div>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 app-text-muted" />
            <select 
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="text-xs app-surface border rounded-md px-2 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Services</option>
              {uniqueApps.map(app => <option key={app} value={app}>{app}</option>)}
            </select>
          </div>
          <div className="w-px h-5 bg-[var(--border-card)] hidden md:block"></div>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 app-text-muted" />
            <select 
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="text-xs app-surface border rounded-md px-2 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Agents</option>
              {uniqueAgents.map(agent => <option key={agent} value={agent}>{agent}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="border app-border rounded-lg overflow-hidden app-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="app-surface border-b app-border font-semibold app-text-muted">
              <tr>
                <th className="px-4 py-3">Session ID</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3">Environment Target</th>
                <th className="px-4 py-3 text-right">Metrics</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y app-divide">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center app-text-muted">
                    No sessions found matching filters.
                  </td>
                </tr>
              ) : (
                filteredSessions.map(session => (
                  <tr 
                    key={session.id} 
                    onClick={() => setSelectedSessionId(session.id)}
                    className="hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4">
                      <div className="font-bold text-blue-500 group-hover:underline">
                        {session.id}
                      </div>
                      <div className="text-[10px] app-text-subtle mt-1 font-mono">
                        Proj: {session.projectId}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono app-text-muted">
                      {new Date(session.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <Server className="w-3 h-3 text-emerald-500" /> {session.metadata?.vmInstance || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <Cloud className="w-3 h-3 text-blue-500" /> {session.metadata?.appService || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <Bot className="w-3 h-3 text-amber-500" /> {session.metadata?.agentHost || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-4 font-mono text-[11px]">
                        <div className="flex flex-col items-end">
                          <span className="app-text-muted">Latency</span>
                          <span className="font-bold">{session.metrics?.averageLatency || 0}s</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="app-text-muted">Cost</span>
                          <span className="font-bold">${(session.metrics?.totalCost || 0).toFixed(4)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="app-text-muted">Traces</span>
                          <span className="font-bold">{session.metrics?.totalTraces || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <ChevronRight className="w-5 h-5 app-text-muted opacity-0 group-hover:opacity-100 transition-opacity inline-block" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Traceability Side Drawer */}
      {selectedSessionId && selectedSession && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setSelectedSessionId(null)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full max-w-4xl app-card shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l app-border overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b app-border app-surface">
              <div>
                <h2 className="text-lg font-extrabold flex items-center gap-2">
                  <AlignLeft className="w-5 h-5 text-blue-500" /> Traceability Explorer
                </h2>
                <div className="text-xs font-mono app-text-muted mt-1">
                  Session: <span className="text-blue-500 font-bold">{selectedSession.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSessionId(null)}
                className="p-2 hover:bg-[var(--bg-card-hover)] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Session Overview Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="app-surface border app-border p-3 rounded-lg text-center space-y-1">
                  <span className="text-[10px] font-mono app-text-muted uppercase block font-semibold">Total Traces</span>
                  <span className="text-lg font-extrabold">{selectedSession.metrics?.totalTraces || 0}</span>
                </div>
                <div className="app-surface border app-border p-3 rounded-lg text-center space-y-1">
                  <span className="text-[10px] font-mono app-text-muted uppercase block font-semibold">Avg Latency</span>
                  <span className="text-lg font-extrabold flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500"/> {selectedSession.metrics?.averageLatency || 0}s
                  </span>
                </div>
                <div className="app-surface border app-border p-3 rounded-lg text-center space-y-1">
                  <span className="text-[10px] font-mono app-text-muted uppercase block font-semibold">Cost</span>
                  <span className="text-lg font-extrabold flex items-center justify-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-500"/> {(selectedSession.metrics?.totalCost || 0).toFixed(4)}
                  </span>
                </div>
                <div className="app-surface border app-border p-3 rounded-lg text-center space-y-1">
                  <span className="text-[10px] font-mono app-text-muted uppercase block font-semibold">Tokens</span>
                  <span className="text-lg font-extrabold flex items-center justify-center gap-1">
                    <Cpu className="w-3 h-3 text-blue-500"/> {selectedSession.metrics?.totalTokens || 0}
                  </span>
                </div>
              </div>

              {/* Traces Tree */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold border-b app-border pb-2">Hierarchical Trace Execution</h3>
                
                {sessionTraceRoots.length === 0 ? (
                  <p className="text-xs app-text-muted text-center py-8">No traces found for this session.</p>
                ) : (
                  <div className="py-2">
                    {sessionTraceRoots.map((rootNode) => (
                      <TraceTreeNode key={rootNode.id} node={rootNode} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
