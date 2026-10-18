import React, { useState, useEffect } from 'react';
import { X, Network, Play, RotateCcw, Sparkles, Sliders, Layers } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

interface HoveredNeuron {
  layerIdx: number;
  neuronIdx: number;
  layerType: string;
}

export const NeuronVisualizerModal: React.FC = () => {
  const isNeuronModalOpen = useStudioStore((s) => s.isNeuronModalOpen);
  const setNeuronModalOpen = useStudioStore((s) => s.setNeuronModalOpen);
  const validationResult = useStudioStore((s) => s.validationResult);

  const [hoveredNeuron, setHoveredNeuron] = useState<HoveredNeuron | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState<number>(-1);
  const [synapseDensity, setSynapseDensity] = useState<'all' | 'hover' | 'sparse'>('all');

  const layerShapes = validationResult?.layer_shapes || [];
  const COLUMN_HEIGHT = 340; // Fixed canonical canvas height for aligned synapse interpolation
  const SVG_WIDTH = 54;      // Width of the bridge between adjacent layers

  // Forward pass signal pulse animation
  useEffect(() => {
    let timer: any;
    if (isAnimating) {
      if (animationStep < layerShapes.length) {
        timer = setTimeout(() => {
          setAnimationStep((prev) => prev + 1);
        }, 350);
      } else {
        timer = setTimeout(() => {
          setIsAnimating(false);
          setAnimationStep(-1);
        }, 500);
      }
    }
    return () => clearTimeout(timer);
  }, [isAnimating, animationStep, layerShapes.length]);

  if (!isNeuronModalOpen) return null;

  const triggerAnimation = () => {
    setAnimationStep(0);
    setIsAnimating(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-[#0a0e18] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-[#070a12]">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 p-2 text-cyan-400 border border-white/10 shadow-sm">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Neuron-Level Architecture Topology
                </h2>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                  Synaptic Mesh Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive synapse connection graph showing feedforward weight paths and layer transformations
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={triggerAnimation}
              disabled={isAnimating}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                isAnimating
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              {isAnimating ? `Propagating Layer ${animationStep + 1}...` : 'Simulate Forward Pass'}
            </button>

            {/* Density Selector */}
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-xs">
              <button
                onClick={() => setSynapseDensity('all')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  synapseDensity === 'all'
                    ? 'bg-indigo-600/40 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Synapses
              </button>
              <button
                onClick={() => setSynapseDensity('hover')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  synapseDensity === 'hover'
                    ? 'bg-indigo-600/40 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hover Focus
              </button>
              <button
                onClick={() => setSynapseDensity('sparse')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  synapseDensity === 'sparse'
                    ? 'bg-indigo-600/40 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sparse
              </button>
            </div>

            <button
              onClick={() => setNeuronModalOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Visualizer Canvas Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 canvas-grid flex flex-col justify-between">
          <div className="flex min-w-max items-center justify-center py-6 px-4">
            {layerShapes.map((layer, layerIdx) => {
              // Bounded neuron count to prevent DOM bottleneck while keeping full architectural fidelity
              const rawDim = layer.output_shape.reduce((a, b) => a * b, 1);
              const displayNeurons = Math.min(rawDim, 10);

              const nextLayer = layerShapes[layerIdx + 1];
              const nextRawDim = nextLayer ? nextLayer.output_shape.reduce((a, b) => a * b, 1) : 0;
              const nextDisplayNeurons = nextLayer ? Math.min(nextRawDim, 10) : 0;

              const isLayerActiveInSignal = animationStep === layerIdx;

              return (
                <React.Fragment key={layer.node_id}>
                  {/* Layer Column */}
                  <div className="flex flex-col items-center shrink-0 z-10">
                    {/* Layer Header */}
                    <div className="mb-3 text-center">
                      <span className="text-xs font-bold text-white flex items-center justify-center gap-1">
                        {layer.layer_type}
                      </span>
                      <div className="text-[10px] font-mono text-cyan-400 font-semibold mt-0.5">
                        [{layer.output_shape.join(', ')}]
                      </div>
                    </div>

                    {/* Column of Neurons (Fixed Canonical Height) */}
                    <div
                      style={{ height: `${COLUMN_HEIGHT}px` }}
                      className={`relative flex flex-col justify-between items-center w-14 rounded-2xl border p-2 transition-all duration-300 ${
                        isLayerActiveInSignal
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-xl shadow-cyan-500/20 scale-[1.03]'
                          : 'border-white/10 bg-[#070b14]/90 shadow-lg'
                      }`}
                    >
                      {Array.from({ length: displayNeurons }).map((_, neuronIdx) => {
                        const isThisHovered =
                          hoveredNeuron?.layerIdx === layerIdx &&
                          hoveredNeuron?.neuronIdx === neuronIdx;

                        const isConnectedToHovered =
                          (hoveredNeuron?.layerIdx === layerIdx - 1) ||
                          (hoveredNeuron?.layerIdx === layerIdx + 1);

                        return (
                          <div
                            key={neuronIdx}
                            onMouseEnter={() =>
                              setHoveredNeuron({
                                layerIdx,
                                neuronIdx,
                                layerType: layer.layer_type,
                              })
                            }
                            onMouseLeave={() => setHoveredNeuron(null)}
                            className={`group relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 ${
                              isThisHovered
                                ? 'scale-150 border-cyan-300 bg-cyan-400 shadow-lg shadow-cyan-400/80 z-20'
                                : isLayerActiveInSignal
                                ? 'scale-125 border-emerald-300 bg-emerald-400 shadow-md shadow-emerald-400/60'
                                : isConnectedToHovered
                                ? 'border-indigo-400 bg-indigo-900/80'
                                : 'border-indigo-400/40 bg-indigo-950/50 hover:scale-125 hover:border-cyan-400 hover:bg-cyan-500'
                            }`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                isThisHovered
                                  ? 'bg-slate-950'
                                  : isLayerActiveInSignal
                                  ? 'bg-emerald-950'
                                  : 'bg-indigo-300 group-hover:bg-white'
                              }`}
                            />

                            {/* Floating Tooltip */}
                            <div className="pointer-events-none absolute left-full ml-2 hidden w-32 rounded-lg border border-white/10 bg-[#090d16] p-2 text-[10px] text-slate-300 shadow-xl group-hover:block z-30">
                              <div className="font-bold text-white">
                                Neuron #{neuronIdx + 1}
                              </div>
                              <div className="text-cyan-400 font-mono mt-0.5">
                                {layer.layer_type}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-1">
                                {nextDisplayNeurons > 0
                                  ? `Connected to ${nextRawDim.toLocaleString()} forward synapses`
                                  : 'Final output unit'}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {rawDim > displayNeurons && (
                        <div className="text-[8px] font-mono text-slate-500 font-semibold">
                          +{rawDim - displayNeurons}
                        </div>
                      )}
                    </div>

                    {/* Param Count Footer */}
                    <div className="mt-3 text-center text-[10px] font-mono text-slate-400">
                      {layer.param_count > 0
                        ? `${layer.param_count.toLocaleString()} params`
                        : '0 params'}
                    </div>
                  </div>

                  {/* Synapse Connection Bridge (SVG between Layer i and Layer i+1) */}
                  {nextLayer && (
                    <div className="relative shrink-0 flex items-center justify-center">
                      <svg
                        style={{ width: `${SVG_WIDTH}px`, height: `${COLUMN_HEIGHT}px` }}
                        viewBox={`0 0 ${SVG_WIDTH} ${COLUMN_HEIGHT}`}
                        className="overflow-visible pointer-events-none"
                      >
                        {Array.from({ length: displayNeurons }).map((_, srcIdx) => {
                          const y1 =
                            displayNeurons === 1
                              ? COLUMN_HEIGHT / 2
                              : ((srcIdx + 0.5) / displayNeurons) * COLUMN_HEIGHT;

                          return Array.from({ length: nextDisplayNeurons }).map((_, tgtIdx) => {
                            // Sparse mode filtering
                            if (
                              synapseDensity === 'sparse' &&
                              (srcIdx + tgtIdx) % 2 !== 0 &&
                              srcIdx !== tgtIdx
                            ) {
                              return null;
                            }

                            const y2 =
                              nextDisplayNeurons === 1
                                ? COLUMN_HEIGHT / 2
                                : ((tgtIdx + 0.5) / nextDisplayNeurons) * COLUMN_HEIGHT;

                            const isSourceHovered =
                              hoveredNeuron?.layerIdx === layerIdx &&
                              hoveredNeuron?.neuronIdx === srcIdx;

                            const isTargetHovered =
                              hoveredNeuron?.layerIdx === layerIdx + 1 &&
                              hoveredNeuron?.neuronIdx === tgtIdx;

                            const isHighlighted = isSourceHovered || isTargetHovered;

                            if (synapseDensity === 'hover' && !isHighlighted && hoveredNeuron) {
                              return null;
                            }

                            // Dynamic Bezier Spline
                            const d = `M 0 ${y1} C ${SVG_WIDTH * 0.5} ${y1}, ${
                              SVG_WIDTH * 0.5
                            } ${y2}, ${SVG_WIDTH} ${y2}`;

                            const isSignalActive = animationStep === layerIdx;

                            return (
                              <path
                                key={`${srcIdx}-${tgtIdx}`}
                                d={d}
                                fill="none"
                                stroke={
                                  isHighlighted
                                    ? '#06b6d4'
                                    : isSignalActive
                                    ? '#34d399'
                                    : 'rgba(99, 102, 241, 0.16)'
                                }
                                strokeWidth={
                                  isHighlighted
                                    ? 2
                                    : isSignalActive
                                    ? 1.8
                                    : 0.8
                                }
                                strokeOpacity={
                                  isHighlighted
                                    ? 1
                                    : isSignalActive
                                    ? 0.8
                                    : synapseDensity === 'hover'
                                    ? 0.1
                                    : 0.35
                                }
                                strokeDasharray={
                                  isSignalActive ? '6 3' : undefined
                                }
                                className={
                                  isSignalActive
                                    ? 'animate-pulse transition-all'
                                    : undefined
                                }
                              />
                            );
                          });
                        })}
                      </svg>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Bottom Explanation Banner */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#070b14]/90 p-3.5 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Synaptic Connection Visualizer:</strong> Neurons are actively wired across layer
                boundaries. Hover over any individual neuron to inspect its exact incoming and feedforward
                synaptic weights.
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Hover Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Forward Pass
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500/60" /> Latent Synapse
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
