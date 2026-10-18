import React, { useEffect, useState } from 'react';
import {
  GitCompare,
  TrendingDown,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { api } from '../api/client';
import { ExperimentRecord } from '../types';

export const ExperimentsPage: React.FC = () => {
  const currentProject = useAppStore((s) => s.currentProject);
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const loadExperiments = async () => {
    try {
      const data = await api.getExperiments();
      setExperiments(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, [currentProject]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      alert('Please select at least 2 experiment runs to compare.');
      return;
    }
    setIsComparing(true);
    try {
      const res = await api.compareExperiments(selectedIds);
      setComparisonResult(res.experiments);
    } catch (e: any) {
      alert(`Comparison failed: ${e.message}`);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Experiment Tracking & Comparison</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit trail of training runs, architecture lineage, hyperparameters, and held-out test evaluations
          </p>
        </div>
        <button
          onClick={handleCompare}
          disabled={selectedIds.length < 2 || isComparing}
          className="flex items-center gap-1.5 rounded-lg bg-accent-blue px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-40"
        >
          <GitCompare className="h-4 w-4" />
          Compare Selected ({selectedIds.length})
        </button>
      </div>

      {/* Comparison Modal / Section if active */}
      {comparisonResult && (
        <div className="rounded-2xl border border-accent-blue/40 bg-studio-900/80 p-5 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-studio-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-accent-blue" />
              Side-by-Side Model Architecture Comparison
            </h3>
            <button
              onClick={() => setComparisonResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-studio-800 text-slate-400">
                  <th className="py-2 pr-4">Experiment Run</th>
                  <th className="py-2 pr-4">Architecture</th>
                  <th className="py-2 pr-4">Parameters</th>
                  <th className="py-2 pr-4">Best Val Loss</th>
                  <th className="py-2 pr-4">Test Accuracy</th>
                  <th className="py-2 pr-4">Training Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-800 text-slate-200">
                {comparisonResult.map((c) => (
                  <tr key={c.experiment_id} className="hover:bg-studio-850">
                    <td className="py-2.5 pr-4 font-sans font-semibold text-white">{c.experiment_name}</td>
                    <td className="py-2.5 pr-4 text-accent-cyan">{c.architecture_name}</td>
                    <td className="py-2.5 pr-4">{c.total_parameters.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-accent-blue">{c.best_val_loss ?? 'N/A'}</td>
                    <td className="py-2.5 pr-4 text-emerald-400 font-bold">
                      {c.test_accuracy !== undefined ? `${(c.test_accuracy * 100).toFixed(2)}%` : 'N/A'}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400">{c.duration_seconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Experiments List */}
      <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-studio-800 pb-2">
          <span>Run Title & Lineage</span>
          <span>Select for Multi-Run Compare</span>
        </div>

        {experiments.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No experiments saved yet. Run a training job to generate verifiable experiment runs.
          </div>
        ) : (
          <div className="space-y-2">
            {experiments.map((exp) => {
              const isChecked = selectedIds.includes(exp.id);
              const summary = exp.metrics_summary || {};
              const testAcc = summary.evaluation?.accuracy;

              return (
                <div
                  key={exp.id}
                  onClick={() => toggleSelect(exp.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-150 ${
                    isChecked
                      ? 'border-accent-blue bg-studio-850 shadow-md ring-1 ring-accent-blue/30'
                      : 'border-studio-800 bg-studio-950/60 hover:border-studio-700 hover:bg-studio-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-studio-700 bg-studio-950 text-accent-blue"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{exp.name}</div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        <span>Job: {exp.training_job_id.slice(0, 8)}</span>
                        <span>•</span>
                        {summary.best_val_loss && (
                          <span>
                            Best Val Loss: <strong className="text-accent-cyan">{summary.best_val_loss}</strong>
                          </span>
                        )}
                        {testAcc !== undefined && (
                          <>
                            <span>•</span>
                            <span>
                              Test Acc: <strong className="text-emerald-400">{(testAcc * 100).toFixed(2)}%</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-mono text-slate-500">
                    {exp.created_at ? new Date(exp.created_at).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
