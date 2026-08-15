import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardWidget, WidgetType, WidgetSize } from '../types/customDashboard';
import {
  LayoutGrid,
  Save,
  ArrowLeft,
  BarChart2,
  PieChart,
  LineChart,
  Table,
  Plus,
  Trash2,
  Settings,
  X,
  Maximize2,
  Minimize2,
  Activity,
  Sliders,
} from 'lucide-react';

const SAMPLE_METRIC_SOURCES = [
  { id: 'gateway_rps_total', name: 'Gateway RPS Throughput (requests/sec)', defaultUnit: 'RPS', defaultType: 'time_series' },
  { id: 'p99_latency_ms', name: 'P99 Egress Latency (ms)', defaultUnit: 'ms', defaultType: 'time_series' },
  { id: 'pii_masked_count', name: 'PII Redacted Entities Rate (%)', defaultUnit: '%', defaultType: 'stat_metric' },
  { id: 'opa_deny_rate', name: 'OPA Authorization Deny Count', defaultUnit: 'incidents', defaultType: 'bar_gauge' },
  { id: 'token_spend_usd', name: 'Token Spend vs Cap ($)', defaultUnit: '$', defaultType: 'stat_metric' },
  { id: 'threat_logs_stream', name: 'Security Threats Event Stream', defaultUnit: 'logs', defaultType: 'logs_table' },
];

export const CreateDashboardCanvasView: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardTitle, setDashboardTitle] = useState('My Custom Grafana Dashboard');
  const [category, setCategory] = useState('SLA & Security');

  // Dashboard Widgets List State
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    {
      id: 'w_1',
      title: 'P99 Gateway Egress Latency',
      type: 'time_series',
      metricSource: 'p99_latency_ms',
      size: '2x1',
      unit: 'ms',
      currentValue: '18 ms',
      dataPoints: [
        { time: '12:00', value: 14 },
        { time: '13:00', value: 16 },
        { time: '14:00', value: 22 },
        { time: '15:00', value: 18 },
        { time: '16:00', value: 15 },
        { time: '17:00', value: 18 },
      ],
    },
    {
      id: 'w_2',
      title: 'Active Ingestion RPS',
      type: 'stat_metric',
      metricSource: 'gateway_rps_total',
      size: '1x1',
      unit: 'RPS',
      currentValue: '1,650 RPS',
      dataPoints: [],
    },
  ]);

  // Config Modal State
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for Add/Edit Widget
  const [widgetTitle, setWidgetTitle] = useState('');
  const [widgetType, setWidgetType] = useState<WidgetType>('time_series');
  const [metricSource, setMetricSource] = useState('p99_latency_ms');
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('2x1');
  const [unit, setUnit] = useState('ms');

  const handleOpenAddModal = (typePreset?: WidgetType) => {
    setEditingWidget(null);
    setWidgetTitle('New Metric Panel');
    setWidgetType(typePreset || 'time_series');
    setMetricSource('gateway_rps_total');
    setWidgetSize('2x1');
    setUnit('RPS');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (widget: DashboardWidget) => {
    setEditingWidget(widget);
    setWidgetTitle(widget.title);
    setWidgetType(widget.type);
    setMetricSource(widget.metricSource);
    setWidgetSize(widget.size);
    setUnit(widget.unit);
    setIsAddModalOpen(true);
  };

  const handleSaveWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!widgetTitle.trim()) return;

    if (editingWidget) {
      // Edit existing widget
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === editingWidget.id
            ? {
                ...w,
                title: widgetTitle,
                type: widgetType,
                metricSource,
                size: widgetSize,
                unit,
              }
            : w
        )
      );
    } else {
      // Create new widget
      const newWidget: DashboardWidget = {
        id: `w_${Date.now().toString().slice(-4)}`,
        title: widgetTitle,
        type: widgetType,
        metricSource,
        size: widgetSize,
        unit,
        currentValue: widgetType === 'stat_metric' ? '1,420 ' + unit : undefined,
        dataPoints: [
          { time: '10:00', value: 20 },
          { time: '11:00', value: 45 },
          { time: '12:00', value: 30 },
          { time: '13:00', value: 60 },
        ],
      };
      setWidgets((prev) => [...prev, newWidget]);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleResizeWidget = (id: string, newSize: WidgetSize) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size: newSize } : w))
    );
  };

  const getSizeClass = (size: WidgetSize) => {
    switch (size) {
      case '1x1':
        return 'col-span-1 row-span-1';
      case '2x1':
        return 'col-span-1 md:col-span-2 row-span-1';
      case '3x1':
        return 'col-span-1 md:col-span-3 row-span-1';
      case '2x2':
        return 'col-span-1 md:col-span-2 row-span-2';
      default:
        return 'col-span-1 md:col-span-2';
    }
  };

  return (
    <div className="space-y-6 min-h-[calc(100vh-140px)] flex flex-col">
      {/* Top Controls Header Bar */}
      <div className="flex items-center justify-between border-b app-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboards/custom')}
            className="p-1.5 rounded-md app-surface border hover:border-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <input
              type="text"
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
              className="text-base font-bold bg-transparent border-b border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none px-1"
            />
            <p className="text-xs app-text-muted">Grafana-like interactive dashboard builder & widget resizer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboards/custom')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-md flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Dashboard
          </button>
        </div>
      </div>

      {/* Widget Preset Toolbar */}
      <div className="flex items-center justify-between app-surface border p-3 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono app-text-muted font-bold uppercase text-[10px]">Add Panel:</span>
          <button
            onClick={() => handleOpenAddModal('time_series')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded app-card border hover:border-blue-500 font-medium transition-colors"
          >
            <LineChart className="w-3.5 h-3.5 text-blue-500" /> Time Series
          </button>
          <button
            onClick={() => handleOpenAddModal('stat_metric')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded app-card border hover:border-blue-500 font-medium transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" /> Stat Counter
          </button>
          <button
            onClick={() => handleOpenAddModal('bar_gauge')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded app-card border hover:border-blue-500 font-medium transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-purple-500" /> Bar Gauge
          </button>
          <button
            onClick={() => handleOpenAddModal('logs_table')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded app-card border hover:border-blue-500 font-medium transition-colors"
          >
            <Table className="w-3.5 h-3.5 text-amber-500" /> Logs Stream
          </button>
        </div>

        <span className="font-mono text-[11px] app-text-muted">
          {widgets.length} Configured Widgets
        </span>
      </div>

      {/* Resizable Dashboard Grid Canvas */}
      <div className="flex-1 border-2 border-dashed app-border rounded-xl p-6 min-h-[450px]">
        {widgets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 app-text-muted my-20">
            <LayoutGrid className="w-12 h-12 app-text-subtle" />
            <div>
              <h3 className="text-sm font-bold">Dashboard Canvas Empty</h3>
              <p className="text-xs app-text-subtle mt-1 max-w-sm">
                Click "+ Add Panel" buttons above to create customizable PromQL / OpenTelemetry widgets.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
            {widgets.map((w) => (
              <div
                key={w.id}
                className={`app-card border p-4 rounded-lg flex flex-col justify-between space-y-3 transition-all ${getSizeClass(
                  w.size
                )}`}
              >
                {/* Widget Header & Controls */}
                <div className="flex items-center justify-between border-b app-border pb-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-xs truncate">{w.title}</span>
                    <span className="text-[9px] font-mono app-text-subtle border app-border px-1.5 py-0.5 rounded uppercase">
                      {w.metricSource}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Widget Resizer Buttons */}
                    <div className="flex items-center app-surface rounded p-0.5 border text-[10px] font-mono">
                      <button
                        onClick={() => handleResizeWidget(w.id, '1x1')}
                        title="1 Column (Small)"
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          w.size === '1x1' ? 'bg-blue-600 text-white' : 'app-text-muted hover:text-blue-500'
                        }`}
                      >
                        1 Col
                      </button>
                      <button
                        onClick={() => handleResizeWidget(w.id, '2x1')}
                        title="2 Columns (Medium)"
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          w.size === '2x1' ? 'bg-blue-600 text-white' : 'app-text-muted hover:text-blue-500'
                        }`}
                      >
                        2 Col
                      </button>
                      <button
                        onClick={() => handleResizeWidget(w.id, '3x1')}
                        title="3 Columns (Full Width)"
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          w.size === '3x1' ? 'bg-blue-600 text-white' : 'app-text-muted hover:text-blue-500'
                        }`}
                      >
                        Full
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenEditModal(w)}
                      title="Edit Widget Query & Title"
                      className="p-1 rounded app-text-muted hover:text-blue-500"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWidget(w.id)}
                      title="Remove Widget"
                      className="p-1 rounded app-text-muted hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Widget Body Visualization */}
                <div className="flex-1 flex flex-col justify-center min-h-[120px]">
                  {w.type === 'stat_metric' && (
                    <div className="space-y-1 text-center py-2">
                      <span className="text-3xl font-extrabold text-blue-500 font-mono">
                        {w.currentValue || '1,650 ' + w.unit}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold block">
                        +12.4% vs 24h average
                      </span>
                    </div>
                  )}

                  {w.type === 'time_series' && (
                    <div className="space-y-2">
                      <div className="h-28 flex items-end justify-between gap-1 pt-2">
                        {w.dataPoints.map((dp, i) => (
                          <div key={i} className="flex-1 bg-slate-200 dark:bg-[#27272a] hover:bg-blue-600 rounded-t transition-all group relative">
                            <div
                              className="bg-blue-600 rounded-t w-full"
                              style={{ height: `${(dp.value / 30) * 100}%` }}
                            ></div>
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 app-card border text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                              {dp.time}: {dp.value} {w.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] font-mono app-text-subtle">
                        <span>12:00</span>
                        <span>14:00</span>
                        <span>17:00</span>
                      </div>
                    </div>
                  )}

                  {w.type === 'bar_gauge' && (
                    <div className="space-y-2 pt-1">
                      {w.dataPoints.map((dp) => (
                        <div key={dp.time} className="space-y-0.5">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span>{dp.time}</span>
                            <span className="font-mono text-blue-500">{dp.value} {w.unit}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(dp.value / 100) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {w.type === 'logs_table' && (
                    <div className="space-y-1 text-xs font-mono">
                      <div className="bg-[#121215] border app-border p-2 rounded flex justify-between">
                        <span className="text-blue-400 font-bold">[22:42] presidio_pii</span>
                        <span className="text-emerald-400">TAINT_PII_REDACTED</span>
                      </div>
                      <div className="bg-[#121215] border app-border p-2 rounded flex justify-between">
                        <span className="text-rose-400 font-bold">[22:40] opa_authz_deny</span>
                        <span className="text-rose-400">403_UNAUTHORIZED</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Widget Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="app-card border border-blue-500 w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b app-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold">
                  {editingWidget ? 'Configure Widget' : 'Add New Dashboard Widget'}
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="app-text-muted hover:text-blue-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWidget} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold app-text-muted block">Widget Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., P99 Egress Latency"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold app-text-muted block">Metric Data Point Source</label>
                <select
                  value={metricSource}
                  onChange={(e) => {
                    setMetricSource(e.target.value);
                    const found = SAMPLE_METRIC_SOURCES.find((s) => s.id === e.target.value);
                    if (found) setUnit(found.defaultUnit);
                  }}
                  className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  {SAMPLE_METRIC_SOURCES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold app-text-muted block">Visualization Type</label>
                  <select
                    value={widgetType}
                    onChange={(e) => setWidgetType(e.target.value as WidgetType)}
                    className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="time_series">Time Series Chart</option>
                    <option value="stat_metric">Stat Counter</option>
                    <option value="bar_gauge">Bar Gauge</option>
                    <option value="logs_table">Logs Stream Table</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold app-text-muted block">Default Grid Span</label>
                  <select
                    value={widgetSize}
                    onChange={(e) => setWidgetSize(e.target.value as WidgetSize)}
                    className="w-full app-surface border rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="1x1">1 Column (Small)</option>
                    <option value="2x1">2 Columns (Medium)</option>
                    <option value="3x1">3 Columns (Full Width)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold app-text-muted block">Unit Formatting</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full app-surface border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 app-surface border text-xs rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-sm flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Panel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
