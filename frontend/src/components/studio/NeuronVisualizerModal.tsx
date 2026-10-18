import React from 'react';
import { X, Network, Eye } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

export const NeuronVisualizerModal: React.FC = () => {
  const isNeuronModalOpen = useStudioStore((s) => s.isNeuronModalOpen);
  const setNeuronModalOpen = useStudioStore((s) => s.setNeuronModalOpen);
  const validationResult = useStudioStore((s) => s.validationResult);
  const graph = useStudioStore((s) => s.graph);

  if (!isNeuronModalOpen) return null;

  const layerShapes = validationResult?.layer_shapes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-studio-700 bg-studio-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-studio-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent-purple/20 p-2 text-accent-purple">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Neuron-Level Architecture Topology</h2>
              <p className="text-xs text-slate-400">
                Visualizing layer dimension transformations and internal representation flow
              </p>
            </div>
          </div>
          <button
            onClick={() => setNeuronModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-studio-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Visualizer Canvas */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex min-w-[700px] items-center justify-between gap-6 py-8">
            {layerShapes.map((layer, idx) => {
              // Calculate bounded neuron count for visualization (max 16 neurons displayed)
              const rawDim = layer.output_shape.reduce((a, b) => a * b, 1);
              const displayNeurons = Math.min(rawDim, 14);

              return (
                <div key={layer.node_id} className="flex flex-col items-center">
                  <div className="mb-2 text-center">
                    <span className="text-xs font-bold text-slate-200">{layer.layer_type}</span>
                    <div className="text-[10px] font-mono text-accent-cyan">
                      [{layer.output_shape.join(', ')}]
                    </div>
                  </div>

                  {/* Column of Neurons */}
                  <div className="flex flex-col items-center gap-1.5 rounded-xl border border-studio-700/80 bg-studio-950/70 p-3 shadow-inner">
                    {Array.from({ length: displayNeurons }).map((_, nIdx) => (
                      <div
                        key={nIdx}
                        className={`h-4 w-4 rounded-full border border-accent-blue/50 bg-accent-blue/20 transition-all hover:scale-125 hover:bg-accent-blue`}
                        title={`Neuron #${nIdx + 1} in ${layer.layer_type}`}
                      />
                    ))}
                    {rawDim > displayNeurons && (
                      <div className="text-[9px] font-mono text-slate-500">
                        +{rawDim - displayNeurons} more
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-center text-[10px] font-mono text-slate-400">
                    {layer.param_count > 0 ? `${layer.param_count.toLocaleString()} params` : '0 params'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg border border-studio-800 bg-studio-950 p-4 text-xs text-slate-400">
            <h4 className="font-semibold text-slate-300">Representation Note:</h4>
            <p className="mt-1">
              Neuron rendering is automatically bounded for high-dimensional feature maps (e.g., convolutional feature maps or wide embeddings) to maintain 60 FPS UI performance while displaying structural transformation fidelity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
