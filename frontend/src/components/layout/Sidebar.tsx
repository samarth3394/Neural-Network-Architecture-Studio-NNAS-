import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  BrainCircuit,
  Database,
  PlayCircle,
  GitCompare,
  Sliders,
  Archive,
  Rocket,
  PenTool,
  Activity,
  Settings,
  Users,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { useAppStore, AppTab } from '../../store/appStore';

interface NavItem {
  id: AppTab;
  label: string;
  icon: any;
  category: 'core' | 'ml' | 'ops' | 'admin';
}

const NAV_ITEMS: NavItem[] = [
  // Core
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'core' },
  { id: 'projects', label: 'Projects', icon: FolderGit2, category: 'core' },
  { id: 'studio', label: 'Architecture Studio', icon: BrainCircuit, category: 'core' },
  // ML Workflow
  { id: 'datasets', label: 'Dataset Registry', icon: Database, category: 'ml' },
  { id: 'training', label: 'Training Jobs', icon: PlayCircle, category: 'ml' },
  { id: 'experiments', label: 'Experiment Tracking', icon: GitCompare, category: 'ml' },
  { id: 'optimization', label: 'Architecture Search', icon: Sliders, category: 'ml' },
  { id: 'explainability', label: 'Live Explainability', icon: PenTool, category: 'ml' },
  // Deployment & Ops
  { id: 'registry', label: 'Model Registry', icon: Archive, category: 'ops' },
  { id: 'deployment', label: 'Model Deployment', icon: Rocket, category: 'ops' },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, category: 'ops' },
  // Governance & Admin
  { id: 'settings', label: 'Workspace Settings', icon: Settings, category: 'admin' },
  { id: 'users', label: 'Access Management', icon: Users, category: 'admin' },
  { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, category: 'admin' },
];

export const Sidebar: React.FC = () => {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-800 bg-[#090d16] p-3 select-none">
      <button
        type="button"
        onClick={() => setActiveTab('landing')}
        className="mb-3 flex w-full items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-850 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-blue-400" />
          NNAS Studio Portal
        </span>
        <span className="text-[10px] text-slate-500 font-mono">v1.0</span>
      </button>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {/* Core Category */}
        <div>
          <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Studio
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.category === 'core').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ML Lifecycle */}
        <div>
          <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Model Lifecycle
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.category === 'ml').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ops & Deployment */}
        <div>
          <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Production &amp; Serving
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.category === 'ops').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin & Security */}
        <div>
          <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Governance
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.category === 'admin').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-medium'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
