import React from 'react';
import { Sliders, X, Info } from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';

export const NodePropertiesPanel: React.FC = () => {
  const selectedNodeId = useStudioStore((s) => s.selectedNodeId);
  const selectNode = useStudioStore((s) => s.selectNode);
  const graph = useStudioStore((s) => s.graph);
  const updateNodeParameters = useStudioStore((s) => s.updateNodeParameters);
  const validationResult = useStudioStore((s) => s.validationResult);

  if (!selectedNodeId) return null;

  const node = graph.nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const shapeInfo = validationResult?.layer_shapes?.find((s) => s.node_id === node.id);
  const params = node.parameters || {};

  const handleParamChange = (key: string, value: any) => {
    updateNodeParameters(node.id, { [key]: value });
  };

  return (
    <div className="absolute right-4 top-16 z-20 w-80 rounded-xl border border-studio-700 bg-studio-900/95 p-4 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-studio-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-accent-blue" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {node.type} Inspector
          </h3>
        </div>
        <button
          onClick={() => selectNode(null)}
          className="rounded p-1 text-slate-400 hover:bg-studio-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Layer metadata */}
      <div className="my-3 space-y-1.5 rounded-lg bg-studio-950/60 p-2.5 text-[11px] font-mono">
        <div className="flex justify-between text-slate-400">
          <span>Node ID:</span>
          <span className="text-slate-200">{node.id}</span>
        </div>
        {shapeInfo && (
          <>
            <div className="flex justify-between text-slate-400">
              <span>Input Shape:</span>
              <span className="text-slate-200">[{shapeInfo.input_shape.join(', ')}]</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Output Shape:</span>
              <span className="text-accent-cyan font-semibold">[{shapeInfo.output_shape.join(', ')}]</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Parameters:</span>
              <span className="text-accent-blue font-semibold">{shapeInfo.param_count.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* Parameter inputs */}
      <div className="space-y-3">
        {node.type === 'Input' && (
          <div>
            <label className="text-[11px] font-medium text-slate-300">Tensor Dimensions (excl. batch):</label>
            <input
              type="text"
              value={(params.shape || [1, 28, 28]).join(', ')}
              onChange={(e) => {
                const parts = e.target.value.split(',').map((p) => parseInt(p.trim(), 10)).filter((p) => !isNaN(p));
                handleParamChange('shape', parts);
              }}
              placeholder="1, 28, 28"
              className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
            />
          </div>
        )}

        {(node.type === 'Linear' || node.type === 'Dense') && (
          <>
            <div>
              <label className="text-[11px] font-medium text-slate-300">Output Features (out_features):</label>
              <input
                type="number"
                min="1"
                max="8192"
                value={params.out_features ?? 64}
                onChange={(e) => handleParamChange('out_features', parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bias_check"
                checked={params.bias ?? true}
                onChange={(e) => handleParamChange('bias', e.target.checked)}
                className="rounded border-studio-700 bg-studio-950 text-accent-blue"
              />
              <label htmlFor="bias_check" className="text-xs text-slate-300">Use Additive Bias</label>
            </div>
          </>
        )}

        {node.type === 'Conv2d' && (
          <>
            <div>
              <label className="text-[11px] font-medium text-slate-300">Output Channels:</label>
              <input
                type="number"
                min="1"
                value={params.out_channels ?? 32}
                onChange={(e) => handleParamChange('out_channels', parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-300">Kernel Size:</label>
                <input
                  type="number"
                  min="1"
                  value={params.kernel_size ?? 3}
                  onChange={(e) => handleParamChange('kernel_size', parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-300">Stride:</label>
                <input
                  type="number"
                  min="1"
                  value={params.stride ?? 1}
                  onChange={(e) => handleParamChange('stride', parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">Padding:</label>
              <input
                type="number"
                min="0"
                value={params.padding ?? 1}
                onChange={(e) => handleParamChange('padding', parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
          </>
        )}

        {(node.type === 'MaxPool2d' || node.type === 'AvgPool2d') && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-300">Window Size:</label>
              <input
                type="number"
                min="1"
                value={params.kernel_size ?? 2}
                onChange={(e) => handleParamChange('kernel_size', parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">Stride:</label>
              <input
                type="number"
                min="1"
                value={params.stride ?? 2}
                onChange={(e) => handleParamChange('stride', parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
          </div>
        )}

        {node.type === 'Dropout' && (
          <div>
            <label className="text-[11px] font-medium text-slate-300">Dropout Probability p (0.0 - 0.9):</label>
            <input
              type="number"
              step="0.05"
              min="0.0"
              max="0.9"
              value={params.p ?? 0.2}
              onChange={(e) => handleParamChange('p', parseFloat(e.target.value))}
              className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
            />
          </div>
        )}

        {(node.type === 'LSTM' || node.type === 'GRU') && (
          <>
            <div>
              <label className="text-[11px] font-medium text-slate-300">Hidden Units:</label>
              <input
                type="number"
                min="4"
                value={params.hidden_size ?? 64}
                onChange={(e) => handleParamChange('hidden_size', parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="bidi_check"
                checked={params.bidirectional ?? false}
                onChange={(e) => handleParamChange('bidirectional', e.target.checked)}
                className="rounded border-studio-700 bg-studio-950 text-accent-blue"
              />
              <label htmlFor="bidi_check" className="text-xs text-slate-300">Bidirectional</label>
            </div>
          </>
        )}

        {node.type === 'TransformerEncoder' && (
          <>
            <div>
              <label className="text-[11px] font-medium text-slate-300">Model Dimension (d_model):</label>
              <input
                type="number"
                step="8"
                value={params.d_model ?? 64}
                onChange={(e) => handleParamChange('d_model', parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-300">Attention Heads (nhead):</label>
              <input
                type="number"
                min="1"
                value={params.nhead ?? 4}
                onChange={(e) => handleParamChange('nhead', parseInt(e.target.value, 10))}
                className="mt-1 w-full rounded border border-studio-700 bg-studio-950 px-2 py-1.5 font-mono text-xs text-slate-200 focus:border-accent-blue focus:outline-none"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
