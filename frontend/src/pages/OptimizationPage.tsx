import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  PlayCircle,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store/appStore';
import { useStudioStore } from '../store/studioStore';
import { api } from '../api/client';
import { ArchitectureRecord, DatasetRecord } from '../types';

export const OptimizationPage: React.FC = () => {
  const currentProject = useAppStore((s) => s.currentProject);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setStudioGraph = useStudioStore((s) => s.setGraph);

  const [architectures, setArchitectures] = useState<ArchitectureRecord[]>([]);
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [selectedArchId, setSelectedArchId] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [maxTrials, setMaxTrials] = useState(4);
  const [strategy, setStrategy] = useState('evolutionary_mutation');
  const [isSearching, setIsSearching] = useState(false);
  const [activeNasJob, setActiveNasJob] = useState<any>(null);

  const loadData = async () => {
    try {
      const archs = await api.getArchitectures();
      setArchitectures(archs);
      if (archs.length > 0 && !selectedArchId) setSelectedArchId(archs[0].id);

      const dsets = await api.getDatasets();
      setDatasets(dsets);
      if (dsets.length > 0 && !selectedDatasetId) setSelectedDatasetId(dsets[0].id);

      const nasJobs = await api.getOptimizationJobs();
      if (nasJobs.length > 0) setActiveNasJob(nasJobs[0]);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProject]);

  // Polling NAS job
  useEffect(() => {
    if (!activeNasJob || (activeNasJob.status !== 'RUNNING' && activeNasJob.status !== 'QUEUED')) return;
    const interval = setInterval(async () => {
      try {
        const updated = await api.getOptimizationJob(activeNasJob.id);
        setActiveNasJob(updated);
      } catch (e) {
        console.error(e);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeNasJob?.id, activeNasJob?.status]);

  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !selectedArchId || !selectedDatasetId) return;
    setIsSearching(true);
    try {
      const job = await api.submitOptimizationJob({
        project_id: currentProject.id,
        base_architecture_id: selectedArchId,
        dataset_id: selectedDatasetId,
        max_trials: maxTrials,
        timeout_seconds: 180,
        strategy,
      });
      setActiveNasJob(job);
    } catch (e: any) {
      alert(`Search failed: ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const paretoData = activeNasJob?.pareto_frontier?.map((p: any) => ({
    x: p.total_parameters,
    y: (p.val_accuracy || 0) * 100,
    name: p.architecture_name,
    trial_id: p.trial_id,
  })) || [];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Automated Architecture Search & Evolution</h1>
          <p className="text-xs text-slate-400 mt-1">
            Resource-bounded evolutionary mutation, Pareto efficiency optimization, and parameter trade-off discovery
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Config Form */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">NAS Search Configuration</h3>

          <form onSubmit={handleStartSearch} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Base Seed Architecture</label>
              <select
                value={selectedArchId}
                onChange={(e) => setSelectedArchId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              >
                {architectures.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.total_params.toLocaleString()} params)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Target Dataset</label>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Search Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              >
                <option value="evolutionary_mutation">Evolutionary Directed Mutation</option>
                <option value="random">Random Sampling</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Maximum Trials Budget</label>
              <input
                type="number"
                min="2"
                max="10"
                value={maxTrials}
                onChange={(e) => setMaxTrials(parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {isSearching ? 'Initiating Search...' : 'Launch Architecture Search'}
            </button>
          </form>

          <div className="rounded-lg border border-studio-800 bg-studio-950 p-3 text-[11px] text-slate-400">
            <strong>Resource Accounting:</strong> Trials strictly enforce timeout limits and maximum parameter budgets to prevent runaway compute costs.
          </div>
        </div>

        {/* Center/Right: Pareto Frontier & Candidate Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          {activeNasJob ? (
            <>
              {/* Pareto Frontier Scatter Chart */}
              <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent-cyan" />
                    Pareto Frontier (Accuracy % vs Total Parameters)
                  </h3>
                  <span className="rounded bg-studio-850 px-2 py-0.5 text-[10px] font-mono text-slate-400 uppercase">
                    Status: {activeNasJob.status}
                  </span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                      <XAxis type="number" dataKey="x" name="Parameters" stroke="#64748b" />
                      <YAxis type="number" dataKey="y" name="Accuracy" unit="%" stroke="#64748b" domain={[0, 100]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                          backgroundColor: '#0b0f17',
                          borderColor: '#232f48',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Scatter name="Pareto Candidates" data={paretoData} fill="#06b6d4" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Candidate Leaderboard */}
              <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Evaluated Architecture Candidates ({activeNasJob.all_trials?.length || 0})
                </h3>

                <div className="space-y-2">
                  {activeNasJob.all_trials?.map((trial: any) => (
                    <div
                      key={trial.trial_id}
                      className="flex items-center justify-between rounded-xl border border-studio-800 bg-studio-950/70 p-3.5 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{trial.architecture_name}</span>
                          <span className="rounded bg-studio-850 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
                            {trial.generation_type}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 font-mono text-[11px] text-slate-400">
                          <span>Params: {trial.total_parameters.toLocaleString()}</span>
                          <span>•</span>
                          <span>Time: {trial.training_duration}s</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Val Accuracy</div>
                          <div className="text-sm font-bold text-accent-cyan font-mono">
                            {((trial.val_accuracy || 0) * 100).toFixed(1)}%
                          </div>
                        </div>

                        {trial.architecture_graph && (
                          <button
                            onClick={() => {
                              setStudioGraph(trial.architecture_graph);
                              setActiveTab('studio');
                            }}
                            className="flex items-center gap-1 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-1 text-xs font-medium text-accent-blue hover:bg-accent-blue/20"
                          >
                            Open in Studio <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Configure parameters and launch an automated architecture search to discover Pareto-optimal network configurations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
