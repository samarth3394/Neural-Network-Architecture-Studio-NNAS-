import React, { useEffect } from 'react';
import { StudioCanvas } from '../components/studio/StudioCanvas';
import { NodePalette } from '../components/studio/NodePalette';
import { NodePropertiesPanel } from '../components/studio/NodePropertiesPanel';
import { ValidationBar } from '../components/studio/ValidationBar';
import { PyTorchCodeModal } from '../components/studio/PyTorchCodeModal';
import { NeuronVisualizerModal } from '../components/studio/NeuronVisualizerModal';
import { useStudioStore } from '../store/studioStore';
import { useAppStore } from '../store/appStore';
import { ArrowRight, Database, PlayCircle, Eye, Rocket, CheckCircle2 } from 'lucide-react';

export const StudioPage: React.FC = () => {
  const validateGraph = useStudioStore((s) => s.validateGraph);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  useEffect(() => {
    validateGraph();
  }, [validateGraph]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Top Guided Pipeline Workflow Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-[#090d16] px-4 py-2 text-xs select-none">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pipeline:</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="flex items-center gap-1.5 rounded-md bg-blue-600/15 border border-blue-500/30 px-2.5 py-1 text-blue-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              1. Design Architecture
            </span>
            <span className="text-slate-600">&rarr;</span>
            <button
              type="button"
              onClick={() => setActiveTab('datasets')}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Database className="h-3 w-3" />
              2. Datasets
            </button>
            <span className="text-slate-600">&rarr;</span>
            <button
              type="button"
              onClick={() => setActiveTab('training')}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <PlayCircle className="h-3 w-3" />
              3. Training
            </button>
            <span className="text-slate-600">&rarr;</span>
            <button
              type="button"
              onClick={() => setActiveTab('explainability')}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Eye className="h-3 w-3" />
              4. Explain (XAI)
            </button>
            <span className="text-slate-600">&rarr;</span>
            <button
              type="button"
              onClick={() => setActiveTab('deployment')}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Rocket className="h-3 w-3" />
              5. Deploy
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('training')}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition-colors"
        >
          <span>Launch Training</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Center workspace: Left Palette + Canvas + Right Inspector */}
      <div className="relative flex flex-1 overflow-hidden">
        <NodePalette />
        <div className="relative flex-1">
          <StudioCanvas />
          <NodePropertiesPanel />
        </div>
      </div>

      {/* Bottom Validation & Parameters Bar */}
      <ValidationBar />

      {/* Modals */}
      <PyTorchCodeModal />
      <NeuronVisualizerModal />
    </div>
  );
};
