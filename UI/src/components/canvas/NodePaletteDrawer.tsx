import React, { useState, useMemo, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { controlsApi } from '../../api/services/controlsApi';
import type { ControlDefinition, ControlCategory } from '../../types/controls';
import {
  ShieldAlert,
  GitFork,
  Lock,
  Zap,
  Box,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  Layers,
  Cpu,
  Key,
  Clock,
  Eye,
  Server,
  Shield,
  Brain,
  Activity,
  Globe,
  BarChart,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  guardrails: ShieldAlert,
  iam: Key,
  secrets: Lock,
  traffic_routing: GitFork,
  rate_limiting: Clock,
  cognitive_containment: Eye,
  output_remediation: CheckCircle2,
  prompt_engineering: Sparkles,
  sandboxing: Box,
  kernel_network: Server,
  policy_code: Shield,
  cognitive_safety: Brain,
  risk_governance: Activity,
  supply_chain: Layers,
  sovereign_compliance: Globe,
  observability_finops: BarChart,
  routing: GitFork,
  policy: Lock,
  optimization: Zap,
  terminals: CheckCircle2,
};

export const NodePaletteDrawer: React.FC = () => {
  const { nodeSelectorPos, setNodeSelectorPos, addControlNode, addTerminalNode } = useCanvasStore();

  const [categories, setCategories] = useState<ControlCategory[]>([]);
  const [allControls, setAllControls] = useState<ControlDefinition[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    controlsApi.getPalette().then((data) => {
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
      if (data.controls && data.controls.length > 0) {
        setAllControls(data.controls as unknown as ControlDefinition[]);
      }
    }).catch((err) => {
      console.warn('[NodePaletteDrawer] Failed to fetch palette from API:', err);
    });
  }, []);

  // Filter controls by search and category
  const filteredControls = useMemo(() => {
    return allControls.filter((control) => {
      // Category filter
      if (selectedCategory !== 'all' && control.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = control.name.toLowerCase().includes(q);
        const matchDesc = control.description.toLowerCase().includes(q);
        const matchCat = control.category.toLowerCase().includes(q);
        const matchSub = (control.subcategory || '').toLowerCase().includes(q);
        return matchName || matchDesc || matchCat || matchSub;
      }

      return true;
    });
  }, [allControls, selectedCategory, searchQuery]);

  if (!nodeSelectorPos) return null;

  const toggleSubcategory = (subId: string) => {
    setExpandedSubcategories((prev) => ({
      ...prev,
      [subId]: prev[subId] === false ? true : false,
    }));
  };

  const handleAddControl = (control: ControlDefinition) => {
    const targetPos = {
      x: (nodeSelectorPos.x || 300) + 120,
      y: (nodeSelectorPos.y || 200) - 20,
    };
    const sourceConn = nodeSelectorPos.sourceNodeId && nodeSelectorPos.sourcePortId
      ? { sourceNodeId: nodeSelectorPos.sourceNodeId, sourcePortId: nodeSelectorPos.sourcePortId }
      : undefined;

    addControlNode(control, targetPos, sourceConn);
  };

  const sourcePortType = nodeSelectorPos.sourcePortType;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-in fade-in duration-150"
      onClick={() => setNodeSelectorPos(null)}
    >
      {/* Floating Center Modal Container with Fixed Big Dimensions */}
      <div
        className="app-card border app-border backdrop-blur-2xl shadow-2xl rounded-2xl w-[940px] h-[660px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Top Header */}
        <div className="app-surface px-5 py-4 border-b app-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold app-text-main flex items-center gap-2">
                Node Controls Palette
                {sourcePortType && (
                  <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Connecting: {sourcePortType}
                  </span>
                )}
              </h2>
              <p className="text-[11px] app-text-muted">
                142 Governance Controls across 16 Security Domains
              </p>
            </div>
          </div>

          <button
            onClick={() => setNodeSelectorPos(null)}
            className="p-1.5 rounded-xl app-surface hover:bg-[var(--bg-card-hover)] app-text-muted hover:app-text-main transition-colors border app-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 border-b app-border app-surface shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 app-text-muted" />
            <input
              type="text"
              placeholder="Search 142 controls by name, description, engine, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs app-surface border app-border rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 app-text-muted hover:app-text-main text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Dual-Pane Body Container */}
        <div className="flex flex-1 h-full min-h-0 overflow-hidden">
          {/* Left Vertical Category Navigation Pane */}
          <div className="w-60 h-full border-r app-border app-surface overflow-y-auto custom-scrollbar p-2 space-y-1 shrink-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${selectedCategory === 'all'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'app-surface hover:bg-slate-200 dark:hover:bg-slate-800 app-text-muted hover:app-text-main'
                }`}
            >
              <span className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">All Controls</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 font-bold shrink-0">
                {allControls.length}
              </span>
            </button>

            <div className="pt-2 pb-1 px-2 text-[10px] font-extrabold uppercase font-mono app-text-subtle tracking-wider">
              Governance Domains
            </div>

            {categories.map((cat) => {
              const IconComp = CATEGORY_ICONS[cat.id] || Cpu;
              const count = allControls.filter((c) => c.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${isSelected
                      ? 'bg-cyan-600 text-white shadow-md font-bold'
                      : 'app-surface hover:bg-slate-200 dark:hover:bg-slate-800 app-text-muted hover:app-text-main'
                    }`}
                  title={cat.label}
                >
                  <span className="flex items-center gap-2 truncate">
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate text-[11px]">{cat.label}</span>
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-800 app-text-subtle'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls List Content Pane */}
          <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
            {/* Terminal Action Endpoints Section */}
            <div className="space-y-2 pb-3 border-b app-border">
              <div className="flex items-center gap-2 pb-1 border-b app-border">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-extrabold tracking-tight uppercase app-text-main font-mono">
                  Terminal Action Endpoints
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Allowed Endpoint */}
                <div
                  onClick={() => {
                    const targetPos = { x: (nodeSelectorPos.x || 300) + 120, y: (nodeSelectorPos.y || 200) - 20 };
                    const sourceConn = nodeSelectorPos.sourceNodeId && nodeSelectorPos.sourcePortId
                      ? { sourceNodeId: nodeSelectorPos.sourceNodeId, sourcePortId: nodeSelectorPos.sourcePortId }
                      : undefined;
                    addTerminalNode('allow_llm', targetPos, sourceConn);
                  }}
                  className="group p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Allowed to LLM
                    </h4>
                    <span className="text-[9px] uppercase font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                      FORWARD
                    </span>
                  </div>
                  <p className="text-[10px] app-text-muted line-clamp-2">
                    Payload clean & authorized. Forwarding to Model Execution.
                  </p>
                  <div className="pt-1.5 border-t border-emerald-500/20 flex items-center justify-between text-[9px] font-mono text-emerald-400 font-bold">
                    <span>Endpoint: LLM Execution</span>
                    <span className="flex items-center gap-0.5"><Plus className="w-3 h-3" /> Connect</span>
                  </div>
                </div>

                {/* Blocked Endpoint */}
                <div
                  onClick={() => {
                    const targetPos = { x: (nodeSelectorPos.x || 300) + 120, y: (nodeSelectorPos.y || 200) - 20 };
                    const sourceConn = nodeSelectorPos.sourceNodeId && nodeSelectorPos.sourcePortId
                      ? { sourceNodeId: nodeSelectorPos.sourceNodeId, sourcePortId: nodeSelectorPos.sourcePortId }
                      : undefined;
                    addTerminalNode('block_llm', targetPos, sourceConn);
                  }}
                  className="group p-2.5 rounded-xl border border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-500 transition-all cursor-pointer flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Blocked / Refused
                    </h4>
                    <span className="text-[9px] uppercase font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold">
                      BLOCK & HALT
                    </span>
                  </div>
                  <p className="text-[10px] app-text-muted line-clamp-2">
                    Security violation detected. Execution halted & blocked.
                  </p>
                  <div className="pt-1.5 border-t border-rose-500/20 flex items-center justify-between text-[9px] font-mono text-rose-400 font-bold">
                    <span>Endpoint: Security Refusal</span>
                    <span className="flex items-center gap-0.5"><Plus className="w-3 h-3" /> Connect</span>
                  </div>
                </div>
              </div>
            </div>

            {filteredControls.length === 0 ? (
              <div className="p-8 text-center app-text-muted space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
                <p className="text-xs font-medium">No controls match your query.</p>
              </div>
            ) : (
              categories
                .filter((cat) => selectedCategory === 'all' || selectedCategory === cat.id)
                .map((cat) => {
                  const catControls = filteredControls.filter((c) => c.category === cat.id);
                  if (catControls.length === 0) return null;

                  const CategoryIcon = CATEGORY_ICONS[cat.id] || Cpu;
                  const subcats = cat.subcategories || [{ id: 'general', label: 'General Controls' }];

                  return (
                    <div key={cat.id} className="space-y-2.5">
                      {/* Category Header */}
                      <div className="flex items-center justify-between border-b app-border pb-1.5">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-cyan-500" />
                          <h3 className="text-xs font-extrabold tracking-tight uppercase app-text-main font-mono">
                            {cat.label}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono app-text-muted bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                          {catControls.length} modules
                        </span>
                      </div>

                      {/* Sub-categories Accordion List */}
                      <div className="space-y-3">
                        {subcats.map((subcat) => {
                          const subControls = catControls.filter(
                            (c) => (c.subcategory || 'general') === subcat.id
                          );
                          if (subControls.length === 0) return null;

                          const isExpanded = expandedSubcategories[subcat.id] !== false;

                          return (
                            <div key={subcat.id} className="space-y-2">
                              {/* Sub-category Accordion Toggle */}
                              <button
                                onClick={() => toggleSubcategory(subcat.id)}
                                className="w-full flex items-center justify-between text-left py-1 text-[11px] font-bold app-text-muted hover:app-text-main transition-colors border-b border-dashed border-slate-700/50"
                              >
                                <span className="flex items-center gap-1.5">
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  {subcat.label}
                                </span>
                                <span className="text-[9px] font-mono app-text-subtle">
                                  {subControls.length} controls
                                </span>
                              </button>

                              {/* Controls Cards Grid */}
                              {isExpanded && (
                                <div className="grid grid-cols-2 gap-2">
                                  {subControls.map((control) => {
                                    const isDisabled = control.is_enabled === false || (control as any).status === 'disabled';
                                    const isMatch = Boolean(sourcePortType) && !isDisabled;
                                    return (
                                      <div
                                        key={control.id}
                                        onClick={() => !isDisabled && handleAddControl(control)}
                                        className={`group p-2.5 rounded-xl border app-border app-surface transition-all flex flex-col justify-between space-y-2 shadow-xs ${
                                          isDisabled
                                            ? 'opacity-50 cursor-not-allowed border-dashed bg-slate-900/40'
                                            : 'hover:border-cyan-500/60 hover:bg-cyan-950/20 cursor-pointer'
                                        }`}
                                      >
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold app-text-main group-hover:text-cyan-400 transition-colors truncate max-w-[170px]" title={control.name}>
                                              {control.name}
                                            </h4>
                                            {isDisabled ? (
                                              <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                                                Phase 2
                                              </span>
                                            ) : isMatch ? (
                                              <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                                Match
                                              </span>
                                            ) : null}
                                          </div>
                                          <p className="text-[10px] app-text-muted line-clamp-2 leading-relaxed">
                                            {control.description}
                                          </p>
                                        </div>

                                        <div className="pt-1.5 border-t app-border flex items-center justify-between text-[9px] font-mono app-text-subtle group-hover:text-cyan-400 transition-colors">
                                          <span className="truncate max-w-[130px]">Engine: {control.id}</span>
                                          {isDisabled ? (
                                            <span className="text-[9px] font-mono text-amber-400 font-bold">Coming Soon</span>
                                          ) : (
                                            <span className="flex items-center gap-0.5 font-bold"><Plus className="w-3 h-3" /> Insert</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
