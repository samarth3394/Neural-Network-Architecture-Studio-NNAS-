import React, { useEffect, useState } from 'react';
import {
  Rocket,
  Activity,
  RotateCcw,
  Play,
  CheckCircle2,
  Cpu,
  Clock,
  Send,
  Plus,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { api } from '../api/client';
import { DeploymentRecord, ModelRecord } from '../types';

export const DeploymentPage: React.FC = () => {
  const currentProject = useAppStore((s) => s.currentProject);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [selectedDep, setSelectedDep] = useState<DeploymentRecord | null>(null);

  // Deploy Modal
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployModelId, setDeployModelId] = useState('');
  const [deployName, setDeployName] = useState('');
  const [deployPath, setDeployPath] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);

  // Testing & Benchmark
  const [inputDataStr, setInputDataStr] = useState('[5.1, 3.5, 1.4, 0.2]');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const loadData = async () => {
    try {
      const deps = await api.getDeployments();
      setDeployments(deps);
      if (deps.length > 0 && !selectedDep) setSelectedDep(deps[0]);

      const allModels = await api.getModels();
      const approvedOrEval = allModels.filter((m) => m.stage === 'approved' || m.stage === 'evaluated' || m.stage === 'deployed');
      setModels(approvedOrEval);
      if (approvedOrEval.length > 0 && !deployModelId) {
        setDeployModelId(approvedOrEval[0].id);
        setDeployName(`${approvedOrEval[0].name}-serving`);
        setDeployPath(`/v1/models/${approvedOrEval[0].name.toLowerCase().replace(/\s+/g, '-')}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProject]);

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployModelId || !deployName || !deployPath) return;
    setIsDeploying(true);
    try {
      const created = await api.createDeployment(deployModelId, deployName, deployPath);
      await loadData();
      setSelectedDep(created);
      setIsDeployModalOpen(false);
    } catch (e: any) {
      alert(`Deployment failed: ${e.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleTestInference = async () => {
    if (!selectedDep) return;
    setIsTesting(true);
    try {
      const parsed = JSON.parse(inputDataStr);
      const res = await api.predictDeployment(selectedDep.id, parsed);
      setTestResult(res);
    } catch (e: any) {
      alert(`Inference error: ${e.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleBenchmark = async () => {
    if (!selectedDep) return;
    setIsBenchmarking(true);
    try {
      const res = await api.benchmarkDeployment(selectedDep.id);
      setBenchmarkResult(res);
      await loadData();
    } catch (e: any) {
      alert(`Benchmark error: ${e.message}`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleRollback = async (targetModelId: string) => {
    if (!selectedDep) return;
    if (!confirm('Are you sure you want to rollback to this previous model version?')) return;
    try {
      await api.rollbackDeployment(selectedDep.id, targetModelId);
      await loadData();
      alert('Rollback completed successfully.');
    } catch (e: any) {
      alert(`Rollback failed: ${e.message}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Model Serving & Inference Runtime</h1>
          <p className="text-xs text-slate-400 mt-1">
            Production REST endpoints with model warmup, p50/p95 latency benchmarking, and zero-downtime rollback
          </p>
        </div>
        <button
          onClick={() => setIsDeployModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          Deploy Approved Model
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deployments List */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Endpoints</div>
          {deployments.length === 0 ? (
            <div className="rounded-2xl border border-studio-800 bg-studio-900/40 p-6 text-center text-xs text-slate-500">
              No deployed endpoints yet. Approve a model in the Registry and click "Deploy Approved Model".
            </div>
          ) : (
            <div className="space-y-2">
              {deployments.map((d) => {
                const isSelected = d.id === selectedDep?.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDep(d)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 ${
                      isSelected
                        ? 'border-accent-blue bg-studio-900/90 shadow-md ring-1 ring-accent-blue/30'
                        : 'border-studio-800 bg-studio-900/50 hover:border-studio-700 hover:bg-studio-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Rocket className={`h-4 w-4 ${isSelected ? 'text-accent-blue' : 'text-slate-400'}`} />
                        <h4 className="text-xs font-semibold text-white">{d.name}</h4>
                      </div>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-mono text-emerald-400 font-bold uppercase">
                        {d.status}
                      </span>
                    </div>
                    <div className="mt-2 text-[11px] font-mono text-accent-cyan truncate">
                      {d.endpoint_path}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-studio-800/80 pt-2">
                      <span>p50: {d.latency_p50}ms</span>
                      <span>Requests: {d.request_count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Endpoint Controls & Interactive Testing */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDep ? (
            <>
              {/* Endpoint Details Bar */}
              <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {selectedDep.name}
                    <span className="rounded bg-studio-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      ID: {selectedDep.id.slice(0, 8)}
                    </span>
                  </h3>
                  <div className="mt-1 font-mono text-xs text-accent-cyan">
                    POST /api/v1/inference/deployments/{selectedDep.id}/predict
                  </div>
                </div>

                <button
                  onClick={handleBenchmark}
                  disabled={isBenchmarking}
                  className="flex items-center gap-1.5 rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1.5 text-xs font-medium text-accent-cyan hover:bg-accent-cyan/20 disabled:opacity-50"
                >
                  <Activity className="h-3.5 w-3.5" />
                  {isBenchmarking ? 'Benchmarking 40 requests...' : 'Benchmark Latency'}
                </button>
              </div>

              {/* Latency Percentiles if Benchmarked */}
              {benchmarkResult && (
                <div className="rounded-2xl border border-accent-cyan/30 bg-studio-900/80 p-5 backdrop-blur-sm">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent-cyan mb-3">
                    Empirical Latency Benchmark Results
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                      <div className="text-[10px] text-slate-400">p50 Latency</div>
                      <div className="text-lg font-bold text-white mt-1">{benchmarkResult.p50_latency_ms} ms</div>
                    </div>
                    <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                      <div className="text-[10px] text-slate-400">p95 Latency</div>
                      <div className="text-lg font-bold text-accent-cyan mt-1">{benchmarkResult.p95_latency_ms} ms</div>
                    </div>
                    <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                      <div className="text-[10px] text-slate-400">p99 Latency</div>
                      <div className="text-lg font-bold text-accent-purple mt-1">{benchmarkResult.p99_latency_ms} ms</div>
                    </div>
                    <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                      <div className="text-[10px] text-slate-400">Throughput</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">
                        {benchmarkResult.throughput_req_per_sec} req/s
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive REST Inference Tester */}
              <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Send className="h-4 w-4 text-accent-blue" />
                    REST Inference Request Tester
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">JSON Sample or Batch</span>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={inputDataStr}
                    onChange={(e) => setInputDataStr(e.target.value)}
                    placeholder="[5.1, 3.5, 1.4, 0.2] or [[...], [...]]"
                    className="w-full rounded-xl border border-studio-700 bg-studio-950 p-3 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleTestInference}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  {isTesting ? 'Sending Request...' : 'Send Inference Request'}
                </button>

                {testResult && (
                  <div className="mt-3 rounded-xl border border-studio-800 bg-studio-950 p-4 font-mono text-xs space-y-2">
                    <div className="flex justify-between text-slate-400 border-b border-studio-900 pb-2">
                      <span>Server Latency: <strong className="text-emerald-400">{testResult.latency_ms} ms</strong></span>
                      <span>Batch Size: {testResult.batch_size}</span>
                    </div>
                    <pre className="text-slate-200 overflow-x-auto">
                      {JSON.stringify(testResult.results, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Rollback Management */}
              <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-accent-amber" />
                    Zero-Downtime Rollback Pointer
                  </h4>
                  <span className="text-[10px] text-slate-500">Instant model pointer switch</span>
                </div>

                <div className="space-y-2">
                  {models
                    .filter((m) => m.id !== selectedDep.model_id)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg border border-studio-800 bg-studio-950 p-2.5 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-200">{m.name}</span>
                          <span className="ml-2 font-mono text-slate-500">v{m.version} ({m.stage})</span>
                        </div>
                        <button
                          onClick={() => handleRollback(m.id)}
                          className="rounded bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                        >
                          Rollback to this version
                        </button>
                      </div>
                    ))}
                  {models.filter((m) => m.id !== selectedDep.model_id).length === 0 && (
                    <div className="text-xs text-slate-500 py-2">No other approved versions available for rollback.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Select or deploy an endpoint from the left to test live inference requests.
            </div>
          )}
        </div>
      </div>

      {/* Deploy Model Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateDeployment}
            className="w-full max-w-md rounded-2xl border border-studio-700 bg-studio-900 p-6 shadow-2xl space-y-3"
          >
            <h3 className="text-base font-bold text-white">Deploy Model to Production</h3>
            <p className="text-xs text-slate-400">Creates a high-performance REST inference endpoint with model warm-up</p>

            <div>
              <label className="text-xs font-medium text-slate-300">Select Approved Model</label>
              <select
                value={deployModelId}
                onChange={(e) => {
                  setDeployModelId(e.target.value);
                  const m = models.find((mod) => mod.id === e.target.value);
                  if (m) {
                    setDeployName(`${m.name}-serving`);
                    setDeployPath(`/v1/models/${m.name.toLowerCase().replace(/\s+/g, '-')}`);
                  }
                }}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (v{m.version} - {m.stage})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Deployment Name</label>
              <input
                type="text"
                required
                value={deployName}
                onChange={(e) => setDeployName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Endpoint Path</label>
              <input
                type="text"
                required
                value={deployPath}
                onChange={(e) => setDeployPath(e.target.value)}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs font-mono text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsDeployModalOpen(false)}
                className="rounded-lg border border-studio-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-studio-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeploying}
                className="rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {isDeploying ? 'Warming up & Deploying...' : 'Confirm & Deploy'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
