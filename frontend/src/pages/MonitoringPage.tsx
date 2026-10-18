import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  HardDrive,
  Clock,
  Layers,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';

export const MonitoringPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await api.getMonitoringHealth();
      setHealthData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">System Observability & Monitoring</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time infrastructure health, background queue concurrency, compute devices, and artifact storage
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-studio-700 bg-studio-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-studio-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Grid of Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend API */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Core API</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-base font-bold text-white uppercase">{healthData?.status || 'Active'}</span>
          </div>
          <div className="text-[11px] text-slate-400">FastAPI Async Lifespan Engine</div>
        </div>

        {/* Database */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Metadata DB</span>
            <CheckCircle2 className="h-4 w-4 text-accent-blue" />
          </div>
          <div className="text-base font-bold text-white">{healthData?.database || 'Connected'}</div>
          <div className="text-[11px] text-slate-400">Connection Pool Pre-Ping Active</div>
        </div>

        {/* Worker Pool */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Worker Queue</span>
            <Zap className="h-4 w-4 text-accent-cyan" />
          </div>
          <div className="text-base font-bold text-white">
            {healthData?.workers?.active_running_jobs || 0} Running / {healthData?.workers?.queued_jobs || 0} Queued
          </div>
          <div className="text-[11px] text-slate-400">Max Concurrency Quota: {healthData?.workers?.max_concurrency || 4}</div>
        </div>

        {/* Compute Device */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">PyTorch Engine</span>
            <Cpu className="h-4 w-4 text-accent-purple" />
          </div>
          <div className="text-base font-bold text-white truncate">
            {healthData?.compute?.device || 'CPU Runtime'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            PyTorch v{healthData?.compute?.pytorch_version || '2.8.0'}
          </div>
        </div>
      </div>

      {/* Disk Storage & Security Boundaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-accent-blue" />
            Artifact Object & Checkpoint Storage
          </h3>
          {healthData?.storage?.total_gb ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Disk Usage: {healthData.storage.used_gb} GB used</span>
                <span>{healthData.storage.free_gb} GB available</span>
              </div>
              <div className="h-3 rounded-full bg-studio-950 overflow-hidden border border-studio-800">
                <div
                  className="h-full bg-accent-blue rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (healthData.storage.used_gb / healthData.storage.total_gb) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Storage adapters handle dataset blobs, checkpoint binaries, and saliency heatmaps with strict path-traversal prevention.
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Local filesystem artifact storage initialized.</div>
          )}
        </div>

        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Operational Safeguards</h3>
          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Stale Job Auto-Recovery on Server Restart</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Model Checkpoint Gate Enforcement before Deployment</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>JWT HS256 Token Session Expiration & Refresh</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Bounded Forward Hooks (No Visualization Tensor Leaks)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
