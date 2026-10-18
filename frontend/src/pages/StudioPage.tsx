import React, { useEffect } from 'react';
import { StudioCanvas } from '../components/studio/StudioCanvas';
import { NodePalette } from '../components/studio/NodePalette';
import { NodePropertiesPanel } from '../components/studio/NodePropertiesPanel';
import { ValidationBar } from '../components/studio/ValidationBar';
import { PyTorchCodeModal } from '../components/studio/PyTorchCodeModal';
import { NeuronVisualizerModal } from '../components/studio/NeuronVisualizerModal';
import { useStudioStore } from '../store/studioStore';

export const StudioPage: React.FC = () => {
  const validateGraph = useStudioStore((s) => s.validateGraph);

  useEffect(() => {
    validateGraph();
  }, [validateGraph]);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
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
