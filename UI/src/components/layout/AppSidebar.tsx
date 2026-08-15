import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Activity,
  Layers,
  Users,
  DollarSign,
  PlusCircle,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentRoute = location.pathname;

  const navSections = [
    {
      id: 'dashboards',
      label: 'DASHBOARDS',
      items: [
        { id: '/dashboards/default', label: 'Default', icon: LayoutDashboard },
        { id: '/dashboards/custom', label: 'Custom Dashboard', icon: Activity },
        { id: '/dashboards/create', label: 'Create Dashboard', icon: PlusCircle, isButton: true },
      ],
    },
    {
      id: 'projects',
      label: 'PROJECTS',
      items: [
        { id: '/projects/all', label: 'All', icon: FolderKanban },
        { id: '/projects/pre-published', label: 'Pre-Published', icon: FolderKanban, badge: 'Drafts' },
        { id: '/projects/published', label: 'Published', icon: FolderKanban, badge: 'Live' },
        { id: '/projects/agents', label: 'All Agents', icon: Bot },
      ],
    },
    {
      id: 'observability',
      label: 'OBSERVABILITY',
      items: [
        { id: '/observability/traces', label: 'Traces', icon: Layers },
        { id: '/observability/sessions', label: 'Sessions', icon: Activity },
        { id: '/observability/users', label: 'Users', icon: Users },
      ],
    },
    {
      id: 'finops',
      label: 'FINOPS',
      items: [{ id: '/finops', label: 'Unit Economics & Costs', icon: DollarSign }],
    },
  ];

  return (
    <aside
      className={`flex flex-col h-screen select-none sticky top-0 z-30 transition-all duration-200 app-surface border-r ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Title Bar & Sidebar Collapse Toggle */}
      <div className="p-4 flex items-center justify-between border-b app-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded-md bg-blue-600 text-white flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="font-extrabold text-sm tracking-tight leading-none truncate uppercase">
                {import.meta.env.VITE_APP_TITLE || 'CONTROL PLANE'}
              </h1>
              <span className="text-[10px] font-mono app-text-muted">
                {import.meta.env.VITE_APP_SUBTITLE || 'Governance Platform v1.4'}
              </span>
            </div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 rounded app-text-muted hover:text-blue-500 transition-colors"
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
        {navSections.map((sec) => (
          <div key={sec.id} className="space-y-1">
            {/* Section Header */}
            {!isCollapsed && (
              <div className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 app-text-subtle">
                {sec.label}
              </div>
            )}

            {/* Sub Items */}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : item.isButton
                        ? 'text-blue-500 hover:bg-blue-500/10 font-bold'
                        : 'app-text-muted hover:text-blue-500 hover:bg-blue-500/5'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : item.isButton ? 'text-blue-500' : 'app-text-muted'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isActive ? 'bg-blue-700 text-white' : 'app-surface border border-slate-700/40 app-text-subtle'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer User Avatar */}
      <div className={`p-3 border-t text-xs flex items-center gap-2.5 app-surface border-t ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
          AD
        </div>
        {!isCollapsed && (
          <div className="truncate">
            <span className="font-semibold block leading-none truncate">Amit Dey</span>
            <span className="text-[10px] font-mono app-text-muted truncate">Staff Architect</span>
          </div>
        )}
      </div>
    </aside>
  );
};
