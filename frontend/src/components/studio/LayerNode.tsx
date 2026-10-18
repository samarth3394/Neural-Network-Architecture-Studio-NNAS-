import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Layers,
  Activity,
  Cpu,
  Minimize2,
  Sliders,
  Repeat,
  Sparkles,
  ArrowRightCircle,
  Trash2,
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { LayerType } from '../../types';

interface LayerNodeData {
  label: string;
  type: LayerType;
  parameters: Record<string, any>;
  shapeInfo?: {
    output_shape: number[];
    param_count: number;
  };
}

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; icon: any }> = {
  Input: { border: 'border-emerald-500/60', bg: 'bg-emerald-950/40', text: 'text-emerald-400', icon: ArrowRightCircle },
  Linear: { border: 'border-blue-500/60', bg: 'bg-blue-950/40', text: 'text-blue-400', icon: Layers },
  Dense: { border: 'border-blue-500/60', bg: 'bg-blue-950/40', text: 'text-blue-400', icon: Layers },
  Conv2d: { border: 'border-purple-500/60', bg: 'bg-purple-950/40', text: 'text-purple-400', icon: Cpu },
  MaxPool2d: { border: 'border-cyan-500/60', bg: 'bg-cyan-950/40', text: 'text-cyan-400', icon: Minimize2 },
  AvgPool2d: { border: 'border-cyan-500/60', bg: 'bg-cyan-950/40', text: 'text-cyan-400', icon: Minimize2 },
  Flatten: { border: 'border-slate-500/60', bg: 'bg-slate-900/60', text: 'text-slate-300', icon: Sliders },
  ReLU: { border: 'border-amber-500/60', bg: 'bg-amber-950/40', text: 'text-amber-400', icon: Activity },
  Sigmoid: { border: 'border-amber-500/60', bg: 'bg-amber-950/40', text: 'text-amber-400', icon: Activity },
  Tanh: { border: 'border-amber-500/60', bg: 'bg-amber-950/40', text: 'text-amber-400', icon: Activity },
  Softmax: { border: 'border-amber-500/60', bg: 'bg-amber-950/40', text: 'text-amber-400', icon: Activity },
  Dropout: { border: 'border-rose-500/60', bg: 'bg-rose-950/40', text: 'text-rose-400', icon: Sliders },
  BatchNorm1d: { border: 'border-teal-500/60', bg: 'bg-teal-950/40', text: 'text-teal-400', icon: Sliders },
  BatchNorm2d: { border: 'border-teal-500/60', bg: 'bg-teal-950/40', text: 'text-teal-400', icon: Sliders },
  LSTM: { border: 'border-indigo-500/60', bg: 'bg-indigo-950/40', text: 'text-indigo-400', icon: Repeat },
  GRU: { border: 'border-indigo-500/60', bg: 'bg-indigo-950/40', text: 'text-indigo-400', icon: Repeat },
  TransformerEncoder: { border: 'border-violet-500/60', bg: 'bg-violet-950/40', text: 'text-violet-400', icon: Sparkles },
};

export const LayerNode = memo((props: any) => {
  const { id, data, selected } = props;
  const deleteNode = useStudioStore((s) => s.deleteNode);
  const selectNode = useStudioStore((s) => s.selectNode);
  const validationResult = useStudioStore((s) => s.validationResult);

  const layerType = (data.type || 'Linear') as LayerType;
  const cfg = CATEGORY_COLORS[layerType] || CATEGORY_COLORS['Linear'];
  const IconComponent = cfg.icon;

  const shapeInfo = validationResult?.layer_shapes?.find((s) => s.node_id === id);

  const getParamSummary = () => {
    const p = data.parameters || {};
    if (layerType === 'Input') return `[${(p.shape || [1, 28, 28]).join(', ')}]`;
    if (layerType === 'Linear' || layerType === 'Dense') return `out: ${p.out_features || 64}`;
    if (layerType === 'Conv2d') return `out: ${p.out_channels || 32}, k: ${p.kernel_size || 3}`;
    if (layerType === 'MaxPool2d' || layerType === 'AvgPool2d') return `k: ${p.kernel_size || 2}, s: ${p.stride || 2}`;
    if (layerType === 'Dropout') return `p: ${p.p ?? 0.2}`;
    if (layerType === 'LSTM' || layerType === 'GRU') return `h: ${p.hidden_size || 64}`;
    if (layerType === 'TransformerEncoder') return `d: ${p.d_model || 64}, h: ${p.nhead || 4}`;
    return 'pass-through';
  };

  return (
    <div
      onClick={() => selectNode(id)}
      className={`group relative min-w-[170px] rounded-xl border bg-studio-900/90 p-3 shadow-xl backdrop-blur-md transition-all duration-150 hover:shadow-2xl ${
        selected ? 'border-accent-blue ring-2 ring-accent-blue/40 shadow-blue-500/20' : cfg.border
      }`}
    >
      {/* Input Handle */}
      {layerType !== 'Input' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !rounded-full !border-2 !border-studio-900 !bg-accent-blue transition-transform hover:!scale-125"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-studio-800 pb-2">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 ${cfg.bg} ${cfg.text}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200">{layerType}</span>
            <div className="text-[10px] font-mono text-slate-400">{getParamSummary()}</div>
          </div>
        </div>

        {layerType !== 'Input' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            className="rounded p-1 text-slate-500 opacity-0 transition-opacity hover:bg-rose-500/20 hover:text-rose-400 group-hover:opacity-100"
            title="Delete Layer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Footer / Shape & Params Badge */}
      <div className="mt-2 flex items-center justify-between text-[10px]">
        {shapeInfo ? (
          <>
            <span className="rounded bg-studio-800/80 px-1.5 py-0.5 font-mono text-slate-300">
              out: [{shapeInfo.output_shape.join(', ')}]
            </span>
            {shapeInfo.param_count > 0 && (
              <span className="font-mono text-accent-cyan">
                {shapeInfo.param_count > 9999
                  ? `${(shapeInfo.param_count / 1000).toFixed(1)}k`
                  : shapeInfo.param_count}{' '}
                p
              </span>
            )}
          </>
        ) : (
          <span className="font-mono text-slate-500">pending shape...</span>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-studio-900 !bg-accent-cyan transition-transform hover:!scale-125"
      />
    </div>
  );
});
