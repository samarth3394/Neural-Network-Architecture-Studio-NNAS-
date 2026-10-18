import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, RotateCcw, Activity, Layers, Cpu, Info } from 'lucide-react';
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
  const COLUMN_HEIGHT = 320;
  const SVG_WIDTH = 76;

  const totalParams = useMemo(() => {
    return layerShapes.reduce((acc, l) => acc + (l.param_count || 0), 0);
  }, [layerShapes]);

  const totalMemoryKb = useMemo(() => {
    // 4 bytes per float32 parameter
    return ((totalParams * 4) / 1024).toFixed(1);
  }, [totalParams]);

  // Forward pass signal pulse animation
  useEffect(() => {
    let timer: any;
    if (isAnimating) {
      if (animationStep < layerShapes.length) {
        timer = setTimeout(() => {
          setAnimationStep((prev) => prev + 1);
        }, 320);
      } else {
        timer = setTimeout(() => {
          setIsAnimating(false);
          setAnimationStep(-1);
        }, 400);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-xl border border-slate-800 bg-[#090d16] shadow-2xl overflow-hidden">
        {/* Engineering Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3.5 bg-[#060911]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-900 p-2 text-blue-400 border border-slate-800">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Neuron Topology & Tensor Flow Graph
                </h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                  {layerShapes.length} Stages • {totalParams.toLocaleString()} Parameters
                </span>
                <span className="rounded bg-blue-950/70 border border-blue-800/80 px-2 py-0.5 text-[10px] font-mono text-blue-400">
                  ~{totalMemoryKb} KB Weight Footprint
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Interactive layer boundary projection with feedforward synapse routing and dimension transforms
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={triggerAnimation}
              disabled={isAnimating}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                isAnimating
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
              }`}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isAnimating ? `Propagating Stage ${animationStep + 1}/${layerShapes.length}...` : 'Simulate Forward Pass'}</span>
            </button>

            {/* Density Selector */}
            <div className="flex items-center rounded-md border border-slate-800 bg-slate-950 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSynapseDensity('all')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  synapseDensity === 'all'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Synapses
              </button>
              <button
                type="button"
                onClick={() => setSynapseDensity('hover')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  synapseDensity === 'hover'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hover Focus
              </button>
              <button
                type="button"
                onClick={() => setSynapseDensity('sparse')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  synapseDensity === 'sparse'
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sparse (50%)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setNeuronModalOpen(false)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Visualizer Canvas Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex flex-col justify-between bg-[#060810]">
          <div className="flex min-w-max items-center justify-center py-4 px-2">
            {layerShapes.map((layer, layerIdx) => {
              const rawDim = layer.output_shape.reduce((a, b) => a * b, 1);
              const displayNeurons = Math.min(rawDim, 10);

              const nextLayer = layerShapes[layerIdx + 1];
              const nextRawDim = nextLayer ? nextLayer.output_shape.reduce((a, b) => a * b, 1) : 0;
              const nextDisplayNeurons = nextLayer ? Math.min(nextRawDim, 10) : 0;

              const isLayerActiveInSignal = animationStep === layerIdx;

              return (
                <React.Fragment key={layer.node_id}>
                  {/* Layer Stage Chassis */}
                  <div className="flex flex-col items-center shrink-0 z-10">
                    {/* Stage Header Info */}
                    <div className="mb-3 text-center space-y-1">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        STAGE {String(layerIdx + 1).padStart(2, '0')}
                      </div>
                      <div className="text-xs font-semibold text-slate-200">
                        {layer.layer_type}
                      </div>
                      <div className="inline-block font-mono text-[10px] text-blue-400 bg-blue-950/40 border border-blue-900/60 px-1.5 py-0.5 rounded">
                        ({layer.output_shape.join(', ')})
                      </div>
                    </div>

                    {/* Column of Neurons (Rack) */}
                    <div
                      style={{ height: `${COLUMN_HEIGHT}px` }}
                      className={`relative flex flex-col justify-between items-center w-12 rounded-lg border p-1.5 transition-all duration-200 ${
                        isLayerActiveInSignal
                          ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/30'
                          : 'border-slate-800/90 bg-[#090d16]'
                      }`}
                    >
                      {Array.from({ length: displayNeurons }).map((_, neuronIdx) => {
                        const isThisHovered =
                          hoveredNeuron?.layerIdx === layerIdx &&
                          hoveredNeuron?.neuronIdx === neuronIdx;

                        const isConnectedToHovered =
                          hoveredNeuron?.layerIdx === layerIdx - 1 ||
                          hoveredNeuron?.layerIdx === layerIdx + 1;

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
                            className={`group relative flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border transition-all duration-150 ${
                              isThisHovered
                                ? 'scale-125 border-blue-400 bg-blue-500 z-20 shadow-md shadow-blue-500/30'
                                : isLayerActiveInSignal
                                ? 'scale-110 border-emerald-400 bg-emerald-500 z-20 shadow-sm shadow-emerald-500/30'
                                : isConnectedToHovered
                                ? 'border-slate-600 bg-slate-800'
                                : 'border-slate-700/80 bg-slate-900 hover:border-blue-400 hover:bg-slate-800'
                            }`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                isThisHovered
                                  ? 'bg-white'
                                  : isLayerActiveInSignal
                                  ? 'bg-slate-950'
                                  : 'bg-slate-400 group-hover:bg-blue-300'
                              }`}
                            />

                            {/* Non-overlapping Micro-tag positioned above unit */}
                            <div className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden whitespace-nowrap rounded bg-slate-900/95 border border-slate-700 px-2 py-0.5 text-[9px] font-mono text-white shadow-xl group-hover:block z-40">
                              Unit #{neuronIdx + 1}
                            </div>
                          </div>
                        );
                      })}

                      {rawDim > displayNeurons && (
                        <div className="text-[8px] font-mono text-slate-400 font-medium">
                          +{rawDim - displayNeurons}
                        </div>
                      )}
                    </div>

                    {/* Stage Specs Footer */}
                    <div className="mt-2.5 text-center space-y-0.5">
                      <div className="text-[10px] font-mono text-slate-300 font-medium">
                        {layer.param_count > 0 ? `${layer.param_count.toLocaleString()} params` : '0 params'}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        {layer.param_count > 0 ? `~${((layer.param_count * 4) / 1024).toFixed(1)} KB` : 'pass-through'}
                      </div>
                    </div>
                  </div>

                  {/* Synapse Connection Bridge (Vector Spline) */}
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

                            const d = `M 0 ${y1} C ${SVG_WIDTH * 0.45} ${y1}, ${
                              SVG_WIDTH * 0.55
                            } ${y2}, ${SVG_WIDTH} ${y2}`;

                            const isSignalActive = animationStep === layerIdx;

                            return (
                              <path
                                key={`${srcIdx}-${tgtIdx}`}
                                d={d}
                                fill="none"
                                stroke={
                                  isHighlighted
                                    ? '#3b82f6'
                                    : isSignalActive
                                    ? '#10b981'
                                    : 'rgba(100, 116, 139, 0.22)'
                                }
                                strokeWidth={
                                  isHighlighted ? 1.75 : isSignalActive ? 1.5 : 0.75
                                }
                                strokeOpacity={
                                  isHighlighted
                                    ? 1
                                    : isSignalActive
                                    ? 0.9
                                    : synapseDensity === 'hover'
                                    ? 0.1
                                    : 0.45
                                }
                                strokeDasharray={isSignalActive ? '5 3' : undefined}
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

          {/* Bottom Telemetry Strip */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between rounded-lg border border-slate-800 bg-[#090d16] px-4 py-2.5 text-xs text-slate-300 gap-3">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                TELEMETRY:
              </span>
              {hoveredNeuron ? (
                <div className="flex flex-wrap items-center gap-2 text-blue-400">
                  <span className="font-semibold text-white">Unit #{hoveredNeuron.neuronIdx + 1}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    Stage {hoveredNeuron.layerIdx + 1}: <strong className="text-white font-mono">{hoveredNeuron.layerType}</strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    Tensor: <strong className="text-blue-300 font-mono">({layerShapes[hoveredNeuron.layerIdx]?.output_shape.join(', ')})</strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    {hoveredNeuron.layerIdx < layerShapes.length - 1 ? (
                      <>
                        Fan-Out:{' '}
                        <strong className="text-emerald-400 font-mono">
                          {layerShapes[hoveredNeuron.layerIdx + 1]?.output_shape
                            .reduce((a, b) => a * b, 1)
                            .toLocaleString()}{' '}
                          weights
                        </strong>
                      </>
                    ) : (
                      <span className="text-emerald-400 font-semibold font-mono">Final Output Classification Unit</span>
                    )}
                  </span>
                </div>
              ) : isAnimating ? (
                <span className="text-emerald-400">
                  Propagating feedforward tensor activations across Stage {animationStep + 1} of {layerShapes.length}...
                </span>
              ) : (
                <span className="text-slate-400">
                  Ready. Hover over any unit to isolate localized synapse paths or run feedforward simulation.
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-600" /> Inactive Synapse
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Isolated Unit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active Wavefront
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
