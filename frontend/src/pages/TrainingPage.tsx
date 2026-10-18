import React, { useEffect, useState } from 'react';
import {
  PlayCircle,
  PauseCircle,
  StopCircle,
  TrendingDown,
  Activity,
  Terminal,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  Eye,
  Rocket,
  AlertTriangle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '../store/appStore';
import { api } from '../api/client';
import { ArchitectureRecord, DatasetRecord, TrainingJobRecord } from '../types';

export const TrainingPage: React.FC = () => {
  const currentProject = useAppStore((s) => s.currentProject);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const [architectures, setArchitectures] = useState<ArchitectureRecord[]>([]);
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [jobs, setJobs] = useState<TrainingJobRecord[]>([]);
  const [activeJob, setActiveJob] = useState<TrainingJobRecord | null>(null);

  // Form parameters
  const [selectedArchId, setSelectedArchId] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [epochs, setEpochs] = useState(8);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState(0.001);
  const [optimizer, setOptimizer] = useState('adam');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const archs = await api.getArchitectures();
      setArchitectures(archs);
      if (archs.length > 0 && !selectedArchId) setSelectedArchId(archs[0].id);

      const dsets = await api.getDatasets();
      setDatasets(dsets);
      if (dsets.length > 0 && !selectedDatasetId) setSelectedDatasetId(dsets[0].id);

      const allJobs = await api.getTrainingJobs();
      setJobs(allJobs);
      if (allJobs.length > 0 && !activeJob) {
        setActiveJob(allJobs[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProject]);

  // Polling active running job
  useEffect(() => {
    if (!activeJob || (activeJob.status !== 'RUNNING' && activeJob.status !== 'QUEUED')) return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getTrainingJob(activeJob.id);
        setActiveJob(updated);
        // Also update list
        setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  const handleStartTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !selectedArchId || !selectedDatasetId) return;
    setIsSubmitting(true);
    try {
      const created = await api.submitTrainingJob({
        project_id: currentProject.id,
        architecture_id: selectedArchId,
        dataset_id: selectedDatasetId,
        epochs,
        batch_size: batchSize,
        learning_rate: learningRate,
        optimizer,
      });
      setActiveJob(created);
      setJobs([created, ...jobs]);
    } catch (e: any) {
      alert(`Failed to start training: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeJob) return;
    try {
      await api.cancelTrainingJob(activeJob.id);
      const updated = await api.getTrainingJob(activeJob.id);
      setActiveJob(updated);
    } catch (e: any) {
      alert(`Error cancelling: ${e.message}`);
    }
  };

  const handlePause = async () => {
    if (!activeJob) return;
    try {
      await api.pauseTrainingJob(activeJob.id);
      const updated = await api.getTrainingJob(activeJob.id);
      setActiveJob(updated);
    } catch (e: any) {
      alert(`Error pausing: ${e.message}`);
    }
  };

  const handleResume = async () => {
    if (!activeJob) return;
    try {
      await api.resumeTrainingJob(activeJob.id);
      const updated = await api.getTrainingJob(activeJob.id);
      setActiveJob(updated);
    } catch (e: any) {
      alert(`Error resuming: ${e.message}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Model Training Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Asynchronous background workers, real-time telemetry, early stopping, and held-out evaluation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Training Hyperparameters */}
        <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">New Training Job</h3>

          <form onSubmit={handleStartTraining} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300">Neural Architecture</label>
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
              <label className="text-xs font-medium text-slate-300">Dataset</label>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.num_samples.toLocaleString()} samples)
                  </option>
                ))}
              </select>

              {/* Shape Mismatch Warning */}
              {(() => {
                const sArch = architectures.find((a) => a.id === selectedArchId);
                const sData = datasets.find((d) => d.id === selectedDatasetId);
                const mismatch =
                  sArch &&
                  sData &&
                  sArch.input_shape &&
                  sData.input_shape &&
                  JSON.stringify(sArch.input_shape) !== JSON.stringify(sData.input_shape);

                if (!mismatch) return null;

                return (
                  <div className="mt-2 rounded-xl border border-amber-500/40 bg-amber-950/40 p-2.5 text-xs text-amber-200">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Input Shape Incompatibility:</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-300">
                      Architecture expects: <strong className="text-cyan-300 font-mono">[{sArch.input_shape.join(', ')}]</strong>
                      <br />
                      Dataset provides: <strong className="text-amber-300 font-mono">[{sData.input_shape.join(', ')}]</strong>
                    </div>
                    <div className="mt-1.5 text-[10px] text-amber-300/90 leading-tight">
                      Pairing a 2D ConvNet with 1D Tabular data will fail. Please select a matching dataset or architecture.
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300">Epochs</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Batch Size</label>
                <input
                  type="number"
                  min="8"
                  max="512"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-300">Learning Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Optimizer</label>
                <select
                  value={optimizer}
                  onChange={(e) => setOptimizer(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-studio-700 bg-studio-950 px-3 py-2 text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                >
                  <option value="adam">Adam</option>
                  <option value="adamw">AdamW</option>
                  <option value="sgd">SGD (momentum=0.9)</option>
                  <option value="rmsprop">RMSprop</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-blue py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50"
            >
              <PlayCircle className="h-4 w-4" />
              {isSubmitting ? 'Queueing Worker...' : 'Dispatch Training Worker'}
            </button>
          </form>

          {/* Past Jobs List */}
          <div className="pt-4 border-t border-studio-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Job History</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => setActiveJob(j)}
                  className={`cursor-pointer rounded-lg border p-2 text-xs transition-colors ${
                    activeJob?.id === j.id
                      ? 'border-accent-blue bg-studio-800 text-white'
                      : 'border-studio-800 bg-studio-950/40 text-slate-400 hover:bg-studio-900'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{j.id.slice(0, 8)}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        j.status === 'SUCCEEDED' ? 'text-emerald-400' : j.status === 'RUNNING' ? 'text-accent-blue' : 'text-slate-400'
                      }`}
                    >
                      {j.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center / Right: Live Training Telemetry & Logs */}
        <div className="lg:col-span-2 space-y-4">
          {activeJob ? (
            <>
              {/* Job Status Banner */}
              <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Job {activeJob.id}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        activeJob.status === 'SUCCEEDED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : activeJob.status === 'RUNNING'
                          ? 'bg-blue-500/20 text-accent-blue border border-blue-500/30 animate-pulse'
                          : activeJob.status === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-studio-800 text-slate-300'
                      }`}
                    >
                      {activeJob.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <span>Epoch: {activeJob.current_epoch}/{activeJob.total_epochs}</span>
                    <span>•</span>
                    <span>Elapsed: {activeJob.duration_seconds}s</span>
                    {activeJob.best_val_loss !== null && (
                      <>
                        <span>•</span>
                        <span>Best Val Loss: <strong className="text-accent-cyan">{activeJob.best_val_loss}</strong></span>
                      </>
                    )}
                  </div>

                  {/* Failure Diagnostics if Job Failed */}
                  {activeJob.status === 'FAILED' && (
                    <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-200">
                      <div className="font-bold flex items-center gap-1.5 text-rose-300">
                        <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                        <span>Training Failure Diagnosis:</span>
                      </div>
                      <div className="mt-1.5 font-mono text-[11px] text-rose-200 bg-black/40 p-2 rounded border border-rose-500/20 break-words">
                        {activeJob.error_message || 'PyTorch execution halted: Tensor shape mismatch between architecture and dataset.'}
                      </div>
                      {activeJob.error_message?.toLowerCase().includes('conv2d') && (
                        <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-500/20 leading-relaxed">
                          💡 <strong>How to Fix:</strong> The architecture has a <code>Conv2d</code> layer (which expects 2D/3D images like MNIST <code>[1, 28, 28]</code>), but the selected dataset is 1D tabular. To train on this dataset, choose a <strong>Linear / Dense MLP</strong> architecture, or select <strong>MNIST</strong> for image Conv2d!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Job Controls */}
                <div className="flex items-center gap-2">
                  {activeJob.status === 'RUNNING' && (
                    <>
                      <button
                        onClick={handlePause}
                        className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20"
                      >
                        <PauseCircle className="h-3.5 w-3.5" />
                        Pause
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
                      >
                        <StopCircle className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    </>
                  )}
                  {activeJob.status === 'PAUSED' && (
                    <button
                      onClick={handleResume}
                      className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
                    >
                      <PlayCircle className="h-3.5 w-3.5" />
                      Resume
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics Chart */}
              <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent-blue" />
                  Real-time Loss and Accuracy Curves
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeJob.metrics_history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                      <XAxis dataKey="epoch" stroke="#64748b" textAnchor="end" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0b0f17',
                          borderColor: '#232f48',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="train_loss" stroke="#3b82f6" name="Train Loss" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="val_loss" stroke="#06b6d4" name="Val Loss" strokeWidth={2} dot={{ r: 3 }} />
                      {activeJob.metrics_history[0]?.val_acc !== undefined && (
                        <Line type="monotone" dataKey="val_acc" stroke="#10b981" name="Val Accuracy" strokeWidth={2} dot={{ r: 3 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Live Terminal Logs */}
              <div className="rounded-2xl border border-studio-800 bg-studio-900/60 p-5 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-slate-400" />
                  Live Execution Logs
                </h3>
                <div className="h-40 overflow-y-auto rounded-xl bg-[#07090e] p-3 font-mono text-[11px] text-slate-300 space-y-1">
                  {activeJob.logs.map((log, i) => (
                    <div key={i} className="leading-relaxed">
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              {/* Post-Training Held-Out Test Evaluation */}
              {activeJob.evaluation && Object.keys(activeJob.evaluation).length > 0 && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Held-Out Test Set Evaluation
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                    {activeJob.evaluation.accuracy !== undefined && (
                      <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                        <div className="text-[10px] text-slate-400">Test Accuracy</div>
                        <div className="text-xl font-bold text-emerald-400 mt-1">
                          {(activeJob.evaluation.accuracy * 100).toFixed(2)}%
                        </div>
                      </div>
                    )}
                    {activeJob.evaluation.mse !== undefined && (
                      <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                        <div className="text-[10px] text-slate-400">Test MSE</div>
                        <div className="text-xl font-bold text-accent-cyan mt-1">
                          {activeJob.evaluation.mse.toFixed(4)}
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                      <div className="text-[10px] text-slate-400">Total Test Samples</div>
                      <div className="text-xl font-bold text-white mt-1">
                        {activeJob.evaluation.total_test_samples || activeJob.evaluation.num_samples || 0}
                      </div>
                    </div>
                    <div className="rounded-xl border border-studio-800 bg-studio-950 p-3">
                      <div className="text-[10px] text-slate-400">Checkpoint Stored</div>
                      <div className="text-xs font-mono text-slate-300 mt-2 truncate">
                        Saved in Registry
                      </div>
                    </div>
                  </div>

                  {/* Flow Action Bar: Proceed to Explain or Deploy */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-500/20 pt-4">
                    <div className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      <span>Model training and checkpoint validated. Next recommended action:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('explainability')}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all"
                      >
                        <Eye className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Inspect &amp; Explain (XAI)</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setActiveTab('deployment')}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all"
                      >
                        <Rocket className="h-3.5 w-3.5" />
                        <span>Deploy Model to REST API</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-500">
              Submit a job from the left panel to watch real-time PyTorch training curves and telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
