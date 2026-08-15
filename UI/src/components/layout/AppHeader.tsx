import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ChevronRight, Moon, Sun, Sparkles } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export const AppHeader: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();

  const getBreadcrumb = (route: string) => {
    switch (route) {
      case '/dashboards/default':
        return 'Dashboards / Default';
      case '/dashboards/custom':
        return 'Dashboards / Custom Dashboard';
      case '/dashboards/create':
        return 'Dashboards / Create Custom Dashboard';
      case '/projects/all':
        return 'Projects / All';
      case '/projects/pre-published':
        return 'Projects / Pre-Published';
      case '/projects/published':
        return 'Projects / Published';
      case '/projects/agents':
        return 'Projects / All Agents';
      case '/observability/traces':
        return 'Observability / Traces';
      case '/observability/sessions':
        return 'Observability / Sessions';
      case '/observability/users':
        return 'Observability / Users';
      case '/finops':
        return 'FinOps / Unit Economics & Costs';
      default:
        return 'Dashboards / Default';
    }
  };

  return (
    <header className="h-14 border-b px-6 flex items-center justify-between select-none sticky top-0 z-20 backdrop-blur-md app-surface border-b">
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="app-text-muted font-semibold">{import.meta.env.VITE_APP_TITLE || 'Control Panel'}</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
        <span className="font-bold text-sm font-sans">{getBreadcrumb(location.pathname)}</span>
      </div>

      {/* Right Tools: Search + RIGHT SIDE THEME SWITCHER */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 app-text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects, agents, rules..."
            className="w-60 border rounded-md pl-9 pr-3 py-1 text-xs focus:outline-none focus:border-blue-500 transition-colors app-surface border"
          />
        </div>

        {/* Centralized Theme Switcher */}
        <div className="flex items-center rounded-md p-0.5 border app-surface border">
          <button
            onClick={() => setTheme('dark')}
            title="Dark Enterprise Theme"
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              theme === 'dark' ? 'bg-blue-600 text-white font-bold' : 'app-text-muted hover:text-blue-500'
            }`}
          >
            <Moon className="w-3 h-3" /> Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            title="Light Clean Theme"
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              theme === 'light' ? 'bg-blue-600 text-white font-bold' : 'app-text-muted hover:text-blue-500'
            }`}
          >
            <Sun className="w-3 h-3" /> Light
          </button>
          <button
            onClick={() => setTheme('midnight')}
            title="OLED Midnight Theme"
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              theme === 'midnight' ? 'bg-blue-600 text-white font-bold' : 'app-text-muted hover:text-blue-500'
            }`}
          >
            <Sparkles className="w-3 h-3" /> OLED
          </button>
        </div>
      </div>
    </header>
  );
};
