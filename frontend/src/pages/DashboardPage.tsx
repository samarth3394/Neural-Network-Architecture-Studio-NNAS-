import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Database,
  Rocket,
  PlayCircle,
  Archive,
  ArrowRight,
  TrendingUp,
  Activity,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { api } from '../api/client';

export const DashboardPage: React.FC = () => {
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const currentProject = useAppStore((s) => s.currentProject);

  const [archCount, setArchCount] = useState(0);
  const [modelCount, setModelCount] = useState(0);
  const [datasetCount, setDatasetCount] = useState(0);
  const [deploymentCount, setDeploymentCount] = useState(0);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [healthInfo, setHealthInfo] = useState<any>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const archs = await api.getArchitectures();
        setArchCount(archs.length);

        const models = await api.getModels();
        setModelCount(models.length);

        const datasets = await api.getDatasets();
        setDatasetCount(datasets.length);

        const deps = await api.getDeployments();
        setDeploymentCount(deps.length);

        const jobs = await api.getTrainingJobs();
        setRecentJobs(jobs.slice(0, 4));

        const health = await api.getMonitoringHealth();
        setHealthInfo(health);
      } catch (e) {
        console.error('Failed to load dashboard:', e);
      }
    };
    loadDashboard();
  }, [currentProject]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Neural Network Architecture Studio</h1>
        <p className="text-xs text-slate-400 mt-1">
          Production AI Platform for Visual Architecture Engineering, Training, Explainability, and Deployment
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-studio-800 bg-studio-900/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Architectures</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-accent-blue">
              <BrainCircuit className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{archCount}</div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            <span>Ready for training</span>
          </div>
        </div>

        <div className="rounded-xl border border-studio-800 bg-studio-900/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Datasets</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-accent-cyan">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{datasetCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">MNIST, Tabular, Synthetic</div>
        </div>

        <div className="rounded-xl border border-studio-800 bg-studio-900/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Registry</span>
            <div className="rounded-lg bg-purple-500/10 p-2 text-accent-purple">
              <Archive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{modelCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Versioned & gated models</div>
        </div>

        <div className="rounded-xl border border-studio-800 bg-studio-900/60 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Deployments</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-accent-emerald">
              <Rocket className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{deploymentCount}</div>
          <div className="mt-1 text-[11px] text-emerald-400">Low-latency REST endpoints</div>
        </div>
      </div>

      {/* Quick Launchpad */}
      <div className="rounded-2xl border border-studio-800 bg-studio-900/40 p-5 backdrop-blur-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Operations</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center justify-between rounded-xl border border-studio-700 bg-studio-850 p-4 text-left transition-all hover:border-accent-blue hover:bg-studio-800"
          >
            <div>
              <div className="text-sm font-semibold text-white">Visual Architecture Studio</div>
              <p className="text-xs text-slate-400 mt-0.5">Design neural network layers and connections</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            onClick={() => setActiveTab('explainability')}
            className="flex items-center justify-between rounded-xl border border-studio-700 bg-studio-850 p-4 text-left transition-all hover:border-accent-purple hover:bg-studio-800"
          >
            <div>
              <div className="text-sm font-semibold text-white">Live MNIST Canvas & Saliency</div>
              <p className="text-xs text-slate-400 mt-0.5">Draw digits and view real-time gradient saliency heatmaps</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>

          <button
            onClick={() => setActiveTab('optimization')}
            className="flex items-center justify-between rounded-xl border border-studio-700 bg-studio-850 p-4 text-left transition-all hover:border-accent-cyan hover:bg-studio-800"
          >
            <div>
              <div className="text-sm font-semibold text-white">Architecture Search (NAS)</div>
              <p className="text-xs text-slate-400 mt-0.5">Automated evolution and Pareto efficiency optimization</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Recent Training Jobs & System State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-studio-800 bg-studio-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Recent Training Runs</h3>
            <button
              onClick={() => setActiveTab('training')}
              className="text-xs text-accent-blue hover:underline"
            >
              View all
            </button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No training runs executed yet. Go to Training Jobs or Architecture Studio to start one!
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-studio-800 bg-studio-950/60 p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        job.status === 'SUCCEEDED'
                          ? 'bg-emerald-400'
                          : job.status === 'RUNNING'
                          ? 'bg-accent-blue animate-pulse'
                          : job.status === 'FAILED'
                          ? 'bg-rose-400'
                          : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <span className="font-semibold text-slate-200">Job {job.id.slice(0, 8)}</span>
                      <div className="text-[10px] text-slate-500">
                        Epochs: {job.current_epoch}/{job.total_epochs} • {job.duration_seconds}s
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    {job.best_val_loss !== null && (
                      <div className="font-mono text-slate-300">
                        val_loss: <span className="text-accent-cyan">{job.best_val_loss}</span>
                      </div>
                    )}
                    <span className="rounded bg-studio-850 px-2 py-0.5 text-[10px] font-mono uppercase text-slate-400">
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System & Compute Status */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/40 p-5 backdrop-blur-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-emerald" />
            Operational Health
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-studio-800/80 pb-2">
              <span className="text-slate-400">Backend Status:</span>
              <span className="font-semibold text-emerald-400">Operational</span>
            </div>
            <div className="flex justify-between border-b border-studio-800/80 pb-2">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-mono text-slate-200">{healthInfo?.database || 'healthy'}</span>
            </div>
            <div className="flex justify-between border-b border-studio-800/80 pb-2">
              <span className="text-slate-400">PyTorch Device:</span>
              <span className="font-mono text-slate-200">{healthInfo?.compute?.device || 'CPU (Host)'}</span>
            </div>
            <div className="flex justify-between border-b border-studio-800/80 pb-2">
              <span className="text-slate-400">Worker Concurrency:</span>
              <span className="font-mono text-slate-200">
                {healthInfo?.workers?.active_running_jobs || 0} / {healthInfo?.workers?.max_concurrency || 4}
              </span>
            </div>
            {healthInfo?.storage?.used_gb !== undefined && (
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Artifact Disk:</span>
                <span className="font-mono text-slate-200">
                  {healthInfo.storage.used_gb} GB / {healthInfo.storage.total_gb} GB
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
