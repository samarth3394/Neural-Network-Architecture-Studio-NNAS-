import React, { useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { useAppStore } from './store/appStore';

import { StudioPage } from './pages/StudioPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { TrainingPage } from './pages/TrainingPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { OptimizationPage } from './pages/OptimizationPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { RegistryPage } from './pages/RegistryPage';
import { DeploymentPage } from './pages/DeploymentPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';

export const App: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const initApp = useAppStore((s) => s.initApp);
  const isLoading = useAppStore((s) => s.isLoading);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'studio':
        return <StudioPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'datasets':
        return <DatasetsPage />;
      case 'training':
        return <TrainingPage />;
      case 'experiments':
        return <ExperimentsPage />;
      case 'optimization':
        return <OptimizationPage />;
      case 'explainability':
        return <ExplainabilityPage />;
      case 'registry':
        return <RegistryPage />;
      case 'deployment':
        return <DeploymentPage />;
      case 'monitoring':
        return <MonitoringPage />;
      case 'settings':
        return <SettingsPage />;
      case 'users':
        return <UsersPage />;
      case 'audit':
        return <AuditPage />;
      default:
        return <StudioPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-studio-950 font-sans text-slate-100">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-[#07090e]">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};
