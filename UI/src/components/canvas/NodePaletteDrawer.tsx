import React, { useState, useMemo } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import controlsRegistry from '../../data/controls.json';
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
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  guardrails: ShieldAlert,
  routing: GitFork,
  policy: Lock,
  optimization: Zap,
  sandboxing: Box,
  terminals: CheckCircle2,
};

export const NodePaletteDrawer: React.FC = () => {
  const { nodeSelectorPos, setNodeSelectorPos, addControlNode, addTerminalNode } = useCanvasStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({
    input_safety: true,
    content_moderation: true,
    logic_gates: true,
    model_routing: true,
    access_control: true,
    compliance_audit: true,
    caching: true,
    microvm: true,
  });

  const categories = controlsRegistry.categories as ControlCategory[];
  const allControls = controlsRegistry.controls as unknown as ControlDefinition[];

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
      [subId]: !prev[subId],
    }));
  };

  const handleAddControl = (control: ControlDefinition) => {
    // Smart position offset
    const targetPos = {
      x: (nodeSelectorPos.x || 300) + 120,
      y: (nodeSelectorPos.y || 200) - 20,
    };

    const sourceConnection =
      nodeSelectorPos.sourceNodeId && nodeSelectorPos.sourcePortId
        ? {
            sourceNodeId: nodeSelectorPos.sourceNodeId,
            sourcePortId: nodeSelectorPos.sourcePortId,
          }
        : undefined;

    addControlNode(control, targetPos, sourceConnection);
  };

  const sourcePortType = nodeSelectorPos.sourcePortType;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-hidden"
      onClick={() => setNodeSelectorPos(null)}
    >
      <div
        className="app-card border app-border backdrop-blur-2xl shadow-2xl rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-100/90 dark:bg-slate-900/90 px-5 py-3.5 border-b app-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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
                Select a control module to insert into the DAG pipeline
              </p>
            </div>
          </div>

          <button
            onClick={() => setNodeSelectorPos(null)}
            className="p-1.5 rounded-lg app-surface hover:bg-slate-200 dark:hover:bg-slate-800 app-text-muted hover:app-text-main transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Category Navigation */}
        <div className="p-4 border-b app-border bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 app-text-muted" />
            <input
              type="text"
              placeholder="Search controls by name, category, or subcategory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs app-surface border app-border rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 app-text-muted hover:app-text-main text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Main Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'app-surface hover:bg-slate-200 dark:hover:bg-slate-800 app-text-muted'
              }`}
            >
              All Controls ({allControls.length})
            </button>
            {categories.map((cat) => {
              const IconComp = CATEGORY_ICONS[cat.id] || Cpu;
              const count = allControls.filter((c) => c.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'app-surface hover:bg-slate-200 dark:hover:bg-slate-800 app-text-muted'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Tree List (Section & Sub-section wise) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Terminal Action Endpoints Section */}
          <div className="space-y-2.5 pb-3 border-b app-border">
            <div className="flex items-center gap-2 pb-1 border-b app-border">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-extrabold tracking-tight uppercase app-text-main font-mono">
                Terminal Action Endpoints
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Allowed Endpoint */}
              <div
                onClick={() => {
                  const targetPos = { x: (nodeSelectorPos.x || 300) + 120, y: (nodeSelectorPos.y || 200) - 20 };
                  const sourceConn = nodeSelectorPos.sourceNodeId && nodeSelectorPos.sourcePortId
                    ? { sourceNodeId: nodeSelectorPos.sourceNodeId, sourcePortId: nodeSelectorPos.sourcePortId }
                    : undefined;
                  addTerminalNode('allow_llm', targetPos, sourceConn);
                }}
                className="group p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Allowed to LLM
                    </h4>
                    <span className="text-[9px] uppercase font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
                      FORWARD
                    </span>
                  </div>
                  <p className="text-[10px] app-text-muted">
                    Payload is clean & authorized. Forwarding to Model Execution.
                  </p>
                </div>
                <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[9px] font-mono text-emerald-400 font-bold">
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
                className="group p-3 rounded-xl border border-rose-500/40 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-500 transition-all cursor-pointer flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Blocked / Refused
                    </h4>
                    <span className="text-[9px] uppercase font-mono bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/30 font-bold">
                      BLOCK & HALT
                    </span>
                  </div>
                  <p className="text-[10px] app-text-muted">
                    Security violation or prompt injection detected. Execution halted & blocked from LLM.
                  </p>
                </div>
                <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-[9px] font-mono text-rose-400 font-bold">
                  <span>Endpoint: Security Refusal</span>
                  <span className="flex items-center gap-0.5"><Plus className="w-3 h-3" /> Connect</span>
                </div>
              </div>
            </div>
          </div>

          {filteredControls.length === 0 ? (
            <div className="p-8 text-center app-text-muted space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
              <p className="text-xs font-medium">No controls match your filter.</p>
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
                    {/* Main Section Header */}
                    <div className="flex items-center gap-2 border-b app-border pb-1.5">
                      <CategoryIcon className="w-4 h-4 text-cyan-500" />
                      <h3 className="text-xs font-extrabold tracking-tight uppercase app-text-main font-mono">
                        {cat.label}
                      </h3>
                      <span className="text-[10px] font-mono app-text-muted bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {catControls.length}
                      </span>
                    </div>

                    {/* Sub-sections */}
                    <div className="space-y-3 pl-2">
                      {subcats.map((subcat) => {
                        const subControls = catControls.filter(
                          (c) => (c.subcategory || 'general') === subcat.id
                        );
                        if (subControls.length === 0) return null;

                        const isExpanded = expandedSubcategories[subcat.id] !== false;

                        return (
                          <div key={subcat.id} className="space-y-2">
                            {/* Sub-section Title */}
                            <button
                              onClick={() => toggleSubcategory(subcat.id)}
                              className="w-full flex items-center justify-between text-left py-1 text-[11px] font-bold app-text-muted hover:app-text-main transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                                {subcat.label}
                              </span>
                              <span className="text-[9px] font-mono app-text-subtle">
                                {subControls.length} modules
                              </span>
                            </button>

                            {/* Sub-section Controls Grid */}
                            {isExpanded && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-3">
                                {subControls.map((control) => {
                                  // Check port compatibility
                                  const isCompatible =
                                    !sourcePortType ||
                                    control.ioValidation.allowedInputs.includes(sourcePortType as any);

                                  return (
                                    <div
                                      key={control.id}
                                      onClick={() => handleAddControl(control)}
                                      className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                                        isCompatible
                                          ? 'app-surface hover:border-cyan-500 hover:shadow-lg'
                                          : 'opacity-60 app-surface border-dashed'
                                      }`}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                          <h4 className="text-xs font-bold app-text-main group-hover:text-cyan-500 transition-colors">
                                            {control.name}
                                          </h4>
                                          {isCompatible && sourcePortType && (
                                            <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 whitespace-nowrap">
                                              <Sparkles className="w-2.5 h-2.5" /> Match
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] app-text-muted line-clamp-2 leading-relaxed">
                                          {control.description}
                                        </p>
                                      </div>

                                      {/* Footer Specs */}
                                      <div className="pt-2 border-t app-border flex items-center justify-between text-[9px] font-mono app-text-subtle">
                                        <span>Engine: {control.runtimeConfig.engine}</span>
                                        <span className="text-cyan-500 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                          <Plus className="w-3 h-3" /> Insert
                                        </span>
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
  );
};
