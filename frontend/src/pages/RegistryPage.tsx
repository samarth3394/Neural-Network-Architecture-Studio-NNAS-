import React, { useEffect, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Rocket,
  Check,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { api } from '../api/client';
import { ModelRecord } from '../types';

export const RegistryPage: React.FC = () => {
  const currentProject = useAppStore((s) => s.currentProject);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  const [models, setModels] = useState<ModelRecord[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [transitionModalModel, setTransitionModalModel] = useState<ModelRecord | null>(null);
  const [targetStage, setTargetStage] = useState<string>('approved');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadModels = async () => {
    try {
      const data = await api.getModels();
      setModels(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadModels();
  }, [currentProject]);

  const handleStageTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionModalModel) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await api.transitionModelStage(transitionModalModel.id, targetStage, approvalNotes);
      await loadModels();
      setTransitionModalModel(null);
      setApprovalNotes('');
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = selectedStage === 'all' ? models : models.filter((m) => m.stage === selectedStage);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Model Registry & Quality Gates</h1>
          <p className="text-xs text-slate-400 mt-1">
            Certified model versions, immutable checkpoint lineage, and validation gates before deployment
          </p>
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-studio-800 bg-studio-900 p-1 text-xs">
          {['all', 'evaluated', 'approved', 'deployed', 'archived'].map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`rounded px-2.5 py-1 capitalize transition-colors ${
                selectedStage === stage
                  ? 'bg-accent-blue font-semibold text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => {
          const metrics = m.metrics || {};
          const testAcc = metrics.accuracy;
          const testMse = metrics.mse;

          return (
            <div
              key={m.id}
              className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4 hover:border-studio-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{m.name}</h3>
                  <div className="text-[11px] font-mono text-slate-400">v{m.version}</div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase font-mono border ${
                    m.stage === 'deployed'
                      ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                      : m.stage === 'approved'
                      ? 'border-blue-500/30 bg-blue-500/20 text-accent-blue'
                      : m.stage === 'evaluated'
                      ? 'border-cyan-500/30 bg-cyan-500/20 text-accent-cyan'
                      : 'border-slate-700 bg-studio-800 text-slate-400'
                  }`}
                >
                  {m.stage}
                </span>
              </div>

              {/* Metrics Box */}
              <div className="rounded-xl border border-studio-800 bg-studio-950 p-3 text-xs font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                  Evaluation Metrics
                </div>
                {testAcc !== undefined && (
                  <div className="flex justify-between text-slate-300">
                    <span>Test Accuracy:</span>
                    <strong className="text-emerald-400">{(testAcc * 100).toFixed(2)}%</strong>
                  </div>
                )}
                {testMse !== undefined && (
                  <div className="flex justify-between text-slate-300">
                    <span>Test MSE:</span>
                    <strong className="text-accent-cyan">{testMse.toFixed(4)}</strong>
                  </div>
                )}
                {m.checkpoint_path && (
                  <div className="flex justify-between text-slate-400 text-[10px] pt-1 border-t border-studio-900 mt-1">
                    <span>Checkpoint:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Stored
                    </span>
                  </div>
                )}
              </div>

              {/* Approval Notes */}
              {m.approval_notes && (
                <div className="text-[11px] text-slate-400 italic bg-studio-950/40 p-2 rounded border border-studio-800/60">
                  "{m.approval_notes}"
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-studio-800 text-xs">
                <button
                  onClick={() => {
                    setTransitionModalModel(m);
                    setErrorMessage(null);
                  }}
                  className="text-accent-blue hover:underline font-medium"
                >
                  Change Stage Gate →
                </button>
                {m.stage === 'approved' && (
                  <button
                    onClick={() => setActiveTab('deployment')}
                    className="flex items-center gap-1 rounded bg-accent-blue/15 px-2 py-1 text-[11px] font-semibold text-accent-blue hover:bg-accent-blue/25"
                  >
                    <Rocket className="h-3 w-3" /> Deploy
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Gate Transition Modal */}
      {transitionModalModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleStageTransition}
            className="w-full max-w-md rounded-2xl border border-studio-700 bg-studio-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">Transition Model Lifecycle Stage</h3>
            <p className="text-xs text-slate-400">
              Model: <strong className="text-white">{transitionModalModel.name}</strong> (v{transitionModalModel.version})
            </p>

            {errorMessage && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300">Target Stage</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              >
                <option value="approved">Approved (Passes production gates)</option>
                <option value="evaluated">Evaluated (Held-out testing complete)</option>
                <option value="draft">Draft (In development)</option>
                <option value="archived">Archived (Deprecated model version)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Approval / Governance Notes</label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Rationale, benchmark results, and review confirmation..."
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransitionModalModel(null)}
                className="rounded-lg border border-studio-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-studio-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-accent-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Validating Gates...' : 'Confirm Stage Gate'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
