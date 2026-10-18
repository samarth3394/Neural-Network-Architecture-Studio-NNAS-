import React, { useState } from 'react';
import {
  Layers,
  Activity,
  Cpu,
  Minimize2,
  Sliders,
  Repeat,
  Sparkles,
  Plus,
  Search,
} from 'lucide-react';
import { useStudioStore } from '../../store/studioStore';
import { LayerType } from '../../types';

interface PaletteItem {
  type: LayerType;
  label: string;
  category: string;
  defaultParams: Record<string, any>;
  icon: any;
  color: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Core
  { type: 'Linear', label: 'Linear / Dense', category: 'Core', defaultParams: { out_features: 64, bias: true }, icon: Layers, color: 'text-blue-400 border-blue-500/30' },
  { type: 'Flatten', label: 'Flatten', category: 'Core', defaultParams: { start_dim: 1 }, icon: Sliders, color: 'text-slate-300 border-slate-500/30' },
  // Activations
  { type: 'ReLU', label: 'ReLU', category: 'Activation', defaultParams: {}, icon: Activity, color: 'text-amber-400 border-amber-500/30' },
  { type: 'Sigmoid', label: 'Sigmoid', category: 'Activation', defaultParams: {}, icon: Activity, color: 'text-amber-400 border-amber-500/30' },
  { type: 'Tanh', label: 'Tanh', category: 'Activation', defaultParams: {}, icon: Activity, color: 'text-amber-400 border-amber-500/30' },
  { type: 'Softmax', label: 'Softmax', category: 'Activation', defaultParams: { dim: -1 }, icon: Activity, color: 'text-amber-400 border-amber-500/30' },
  // Convolutional & Pooling
  { type: 'Conv2d', label: 'Conv2d', category: 'Convolutional', defaultParams: { out_channels: 32, kernel_size: 3, stride: 1, padding: 1, bias: true }, icon: Cpu, color: 'text-purple-400 border-purple-500/30' },
  { type: 'MaxPool2d', label: 'MaxPool2d', category: 'Pooling', defaultParams: { kernel_size: 2, stride: 2, padding: 0 }, icon: Minimize2, color: 'text-cyan-400 border-cyan-500/30' },
  { type: 'AvgPool2d', label: 'AvgPool2d', category: 'Pooling', defaultParams: { kernel_size: 2, stride: 2, padding: 0 }, icon: Minimize2, color: 'text-cyan-400 border-cyan-500/30' },
  // Regularization & Normalization
  { type: 'Dropout', label: 'Dropout', category: 'Regularization', defaultParams: { p: 0.2 }, icon: Sliders, color: 'text-rose-400 border-rose-500/30' },
  { type: 'BatchNorm1d', label: 'BatchNorm1d', category: 'Normalization', defaultParams: { eps: 1e-5, momentum: 0.1 }, icon: Sliders, color: 'text-teal-400 border-teal-500/30' },
  { type: 'BatchNorm2d', label: 'BatchNorm2d', category: 'Normalization', defaultParams: { eps: 1e-5, momentum: 0.1 }, icon: Sliders, color: 'text-teal-400 border-teal-500/30' },
  // Recurrent & Attention
  { type: 'LSTM', label: 'LSTM', category: 'Recurrent', defaultParams: { hidden_size: 64, num_layers: 1, bidirectional: false, batch_first: true }, icon: Repeat, color: 'text-indigo-400 border-indigo-500/30' },
  { type: 'GRU', label: 'GRU', category: 'Recurrent', defaultParams: { hidden_size: 64, num_layers: 1, bidirectional: false, batch_first: true }, icon: Repeat, color: 'text-indigo-400 border-indigo-500/30' },
  { type: 'TransformerEncoder', label: 'Transformer Encoder', category: 'Attention', defaultParams: { d_model: 64, nhead: 4, dim_feedforward: 128, num_layers: 2, dropout: 0.1 }, icon: Sparkles, color: 'text-violet-400 border-violet-500/30' },
];

export const NodePalette: React.FC = () => {
  const [search, setSearch] = useState('');
  const addNode = useStudioStore((s) => s.addNode);
  const graph = useStudioStore((s) => s.graph);

  const filtered = PALETTE_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (item: PaletteItem) => {
    const existingCount = graph.nodes.filter((n) => n.type === item.type).length;
    const newId = `${item.type.toLowerCase()}_${existingCount + 1}`;
    // Position node to the right of last node
    const lastNode = graph.nodes[graph.nodes.length - 1];
    const newPos = lastNode
      ? { x: (lastNode.position?.x || 100) + 180, y: lastNode.position?.y || 180 }
      : { x: 200, y: 180 };

    addNode({
      id: newId,
      type: item.type,
      name: `${item.label} ${existingCount + 1}`,
      parameters: { ...item.defaultParams },
      position: newPos,
    });
  };

  const categories = Array.from(new Set(filtered.map((item) => item.category)));

  return (
    <div className="flex h-full w-64 flex-col border-r border-studio-800 bg-studio-900/80 p-3 backdrop-blur-md">
      <div className="mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Layer Catalog</h3>
        <p className="text-[11px] text-slate-500">Click to add layer to pipeline</p>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search layers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-studio-700 bg-studio-950 py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder-slate-500 focus:border-accent-blue focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {cat}
            </div>
            <div className="space-y-1">
              {filtered
                .filter((item) => item.category === cat)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => handleAdd(item)}
                      className={`group flex w-full items-center justify-between rounded-lg border bg-studio-850/60 p-2 text-left text-xs transition-all duration-150 hover:bg-studio-800 hover:shadow-md ${item.color}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="font-medium text-slate-200">{item.label}</span>
                      </div>
                      <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
