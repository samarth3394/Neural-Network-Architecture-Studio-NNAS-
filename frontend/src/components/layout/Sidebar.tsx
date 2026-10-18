import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  BrainCircuit,
  Database,
  PlayCircle,
  GitCompare,
  Sparkles,
  Archive,
  Rocket,
  PenTool,
  Activity,
  Settings,
  Users,
  ShieldCheck,
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
  { id: 'optimization', label: 'Architecture Search', icon: Sparkles, category: 'ml' },
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
    <aside className="flex h-full w-56 flex-col border-r border-studio-800 bg-studio-950 p-3 select-none">
      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {/* Core Category */}
        <div>
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Studio
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.category === 'core').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent-blue/15 text-accent-blue shadow-sm'
                      : 'text-slate-400 hover:bg-studio-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-accent-blue' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ML Lifecycle */}
        <div>
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Model Lifecycle
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.category === 'ml').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent-blue/15 text-accent-blue shadow-sm'
                      : 'text-slate-400 hover:bg-studio-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-accent-blue' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ops & Deployment */}
        <div>
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Production & Serving
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.category === 'ops').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent-blue/15 text-accent-blue shadow-sm'
                      : 'text-slate-400 hover:bg-studio-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-accent-blue' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin & Security */}
        <div>
          <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Governance
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.category === 'admin').map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent-blue/15 text-accent-blue shadow-sm'
                      : 'text-slate-400 hover:bg-studio-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-accent-blue' : 'text-slate-400'}`} />
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
