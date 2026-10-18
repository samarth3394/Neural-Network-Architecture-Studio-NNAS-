import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Code2,
  Eye,
  Wand2,
  Cpu,
  Layers,
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

export const ValidationBar: React.FC = () => {
  const validationResult = useStudioStore((s) => s.validationResult);
  const fetchPyTorchCode = useStudioStore((s) => s.fetchPyTorchCode);
  const setNeuronModalOpen = useStudioStore((s) => s.setNeuronModalOpen);
  const autoLayout = useStudioStore((s) => s.autoLayout);

  const isValid = validationResult?.is_valid ?? true;
  const totalParams = validationResult?.total_parameters ?? 0;
  const trainableParams = validationResult?.trainable_parameters ?? 0;
  const errors = validationResult?.errors ?? [];
  const warnings = validationResult?.warnings ?? [];

  return (
    <div className="border-t border-studio-800 bg-studio-900/95 px-4 py-2.5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Validation status & Parameters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {isValid ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Valid Architecture
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-3.5 w-3.5" />
                Validation Errors ({errors.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-accent-blue" />
              <span>Total Params:</span>
              <strong className="text-white">{totalParams.toLocaleString()}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-accent-cyan" />
              <span>Trainable:</span>
              <strong className="text-white">{trainableParams.toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* Right: Quick Studio Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={autoLayout}
            className="flex items-center gap-1.5 rounded-lg border border-studio-700 bg-studio-850 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-studio-800 hover:text-white"
            title="Auto Layout Nodes"
          >
            <Wand2 className="h-3.5 w-3.5 text-accent-amber" />
            Auto Layout
          </button>
          <button
            onClick={() => setNeuronModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-studio-700 bg-studio-850 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-studio-800 hover:text-white"
            title="Neuron Visualizer"
          >
            <Eye className="h-3.5 w-3.5 text-accent-purple" />
            Neuron Inspection
          </button>
          <button
            onClick={fetchPyTorchCode}
            className="flex items-center gap-1.5 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-1.5 text-xs font-medium text-accent-blue transition-colors hover:bg-accent-blue/20"
            title="Preview PyTorch Model Code"
          >
            <Code2 className="h-3.5 w-3.5" />
            PyTorch Code
          </button>
        </div>
      </div>

      {/* Error or warning banner if any */}
      {errors.length > 0 && (
        <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-950/40 p-2 text-xs text-rose-300">
          <div className="font-semibold">Graph Validation Issues:</div>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && errors.length === 0 && (
        <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-950/30 p-2 text-xs text-amber-300">
          <div className="font-semibold">Warnings:</div>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
