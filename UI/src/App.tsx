import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider, createTheme } from '@mantine/core';
import { ErrorBoundary } from 'react-error-boundary';
import '@mantine/core/styles.css';

import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { AppSidebar } from './components/layout/AppSidebar';
import { AppHeader } from './components/layout/AppHeader';
import { PageLoader } from './components/common/PageLoader';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { LoginView } from './views/auth';

const DashboardView = lazy(() => import('./views/dashboards').then(m => ({ default: m.DashboardView })));
const CustomDashboardsView = lazy(() => import('./views/dashboards').then(m => ({ default: m.CustomDashboardsView })));
const CreateDashboardCanvasView = lazy(() => import('./views/dashboards').then(m => ({ default: m.CreateDashboardCanvasView })));
const ProjectsView = lazy(() => import('./views/projects').then(m => ({ default: m.ProjectsView })));
const ObservabilityTracesView = lazy(() => import('./views/observability').then(m => ({ default: m.ObservabilityTracesView })));
const ObservabilitySessionsView = lazy(() => import('./views/observability').then(m => ({ default: m.ObservabilitySessionsView })));
const ObservabilityUsersView = lazy(() => import('./views/observability').then(m => ({ default: m.ObservabilityUsersView })));
const FinOpsView = lazy(() => import('./views/finops').then(m => ({ default: m.FinOpsView })));

const queryClient = new QueryClient();

const mantineTheme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, system-ui, sans-serif',
});

function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex font-sans app-bg">
      {/* Collapsible Sidebar with React Router navigation */}
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden app-bg">
        <AppHeader />
        <main className="flex-1 overflow-x-hidden p-6 md:p-8 max-w-[1600px] mx-auto w-full app-bg">
          <ErrorBoundary FallbackComponent={GlobalErrorBoundary}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Redirect / to /dashboards/default */}
                <Route path="/" element={<Navigate to="/dashboards/default" replace />} />

                {/* Loader Demo Route */}
                <Route path="/loader-demo" element={<PageLoader />} />

                {/* Dashboards Routes */}
                <Route path="/dashboards/default" element={<DashboardView />} />
                <Route path="/dashboards/custom" element={<CustomDashboardsView />} />
                <Route path="/dashboards/create" element={<CreateDashboardCanvasView />} />

                {/* Projects & Agents Routes */}
                <Route path="/projects/all" element={<ProjectsView filterMode="all" />} />
                <Route path="/projects/pre-published" element={<ProjectsView filterMode="pre-published" />} />
                <Route path="/projects/published" element={<ProjectsView filterMode="published" />} />
                <Route path="/projects/agents" element={<ProjectsView filterMode="agents" />} />

                {/* Observability Routes */}
                <Route path="/observability/traces" element={<ObservabilityTracesView />} />
                <Route path="/observability/sessions" element={<ObservabilitySessionsView />} />
                <Route path="/observability/users" element={<ObservabilityUsersView />} />

                {/* FinOps Routes */}
                <Route path="/finops" element={<FinOpsView />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/dashboards/default" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function App() {
  const { theme } = useThemeStore();
  const { status, token, rehydrate } = useAuthStore();

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  const isAuthenticated = status === 'authenticated' && !!token;
  const isLight = theme === 'light';

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={mantineTheme} defaultColorScheme={isLight ? 'light' : 'dark'}>
        <BrowserRouter>
          {isAuthenticated ? <AppLayout /> : <LoginView />}
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
