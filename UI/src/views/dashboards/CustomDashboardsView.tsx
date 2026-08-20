import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Plus } from 'lucide-react';

export const CustomDashboardsView: React.FC = () => {
  const navigate = useNavigate();

  const customDashboards = [
    {
      id: 'dash_fintech_slas',
      title: 'Global FinTech SLA & Latency Board',
      category: 'SLA Monitoring',
      widgetsCount: 6,
      updatedAt: '10m ago',
      createdBy: 'Amit Dey',
    },
    {
      id: 'dash_security_audit',
      title: 'Security & PII Breach Incidents',
      category: 'Security Operations',
      widgetsCount: 4,
      updatedAt: '1h ago',
      createdBy: 'Security Team',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Custom Dashboards
          </h1>
          <p className="text-xs app-text-muted mt-1">
            User-configured Grafana-style custom metric panels and widget boards.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboards/create')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Custom Dashboard
        </button>
      </div>

      {/* Grid of Dashboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customDashboards.map((d) => (
          <div
            key={d.id}
            className="app-card border hover:border-blue-500 p-5 rounded-lg space-y-4 transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/10 text-blue-500 border border-blue-500/30 px-2 py-0.5 rounded">
                  {d.category}
                </span>
                <span className="text-[10px] font-mono app-text-subtle">{d.updatedAt}</span>
              </div>
              <h3 className="text-sm font-bold pt-1">{d.title}</h3>
            </div>

            <div className="text-xs app-text-muted font-mono flex items-center justify-between border-t app-border pt-3">
              <span>{d.widgetsCount} Widgets</span>
              <span>Author: {d.createdBy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
