import { create } from 'zustand';
import { ArchitectureGraph, ArchitectureNode, ArchitectureEdge, ValidationResult } from '../types';
import { api } from '../api/client';

interface StudioState {
  graph: ArchitectureGraph;
  validationResult: ValidationResult | null;
  selectedNodeId: string | null;
  isDirty: boolean;
  pytorchCode: string;
  isCodeModalOpen: boolean;
  isNeuronModalOpen: boolean;
  history: ArchitectureGraph[];
  historyIndex: number;

  setGraph: (graph: ArchitectureGraph) => void;
  updateGraphMetadata: (name: string, task: 'classification' | 'regression', inputShape: number[]) => void;
  addNode: (node: ArchitectureNode) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodeParameters: (id: string, params: Record<string, any>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: ArchitectureEdge) => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  validateGraph: () => Promise<void>;
  fetchPyTorchCode: () => Promise<void>;
  setCodeModalOpen: (open: boolean) => void;
  setNeuronModalOpen: (open: boolean) => void;
  undo: () => void;
  redo: () => void;
  autoLayout: () => void;
}

const defaultInitialGraph: ArchitectureGraph = {
  name: 'MNIST Visual ConvNet',
  version: '1.0.0',
  task: 'classification',
  framework: 'pytorch',
  input_shape: [1, 28, 28],
  num_classes: 10,
  nodes: [
    { id: 'in', type: 'Input', parameters: { shape: [1, 28, 28] }, position: { x: 50, y: 180 } },
    { id: 'c1', type: 'Conv2d', parameters: { out_channels: 16, kernel_size: 3, padding: 1 }, position: { x: 260, y: 180 } },
    { id: 'r1', type: 'ReLU', parameters: {}, position: { x: 440, y: 180 } },
    { id: 'p1', type: 'MaxPool2d', parameters: { kernel_size: 2, stride: 2 }, position: { x: 580, y: 180 } },
    { id: 'fl', type: 'Flatten', parameters: { start_dim: 1 }, position: { x: 740, y: 180 } },
    { id: 'fc1', type: 'Linear', parameters: { out_features: 64 }, position: { x: 880, y: 180 } },
    { id: 'r2', type: 'ReLU', parameters: {}, position: { x: 1040, y: 180 } },
    { id: 'fc2', type: 'Linear', parameters: { out_features: 10 }, position: { x: 1180, y: 180 } },
  ],
  edges: [
    { id: 'e1', source: 'in', target: 'c1' },
    { id: 'e2', source: 'c1', target: 'r1' },
    { id: 'e3', source: 'r1', target: 'p1' },
    { id: 'e4', source: 'p1', target: 'fl' },
    { id: 'e5', source: 'fl', target: 'fc1' },
    { id: 'e6', source: 'fc1', target: 'r2' },
    { id: 'e7', source: 'r2', target: 'fc2' },
  ],
};

export const useStudioStore = create<StudioState>((set, get) => ({
  graph: defaultInitialGraph,
  validationResult: null,
  selectedNodeId: null,
  isDirty: false,
  pytorchCode: '',
  isCodeModalOpen: false,
  isNeuronModalOpen: false,
  history: [defaultInitialGraph],
  historyIndex: 0,

  setGraph: (graph: ArchitectureGraph) => {
    set({ graph, isDirty: false, selectedNodeId: null });
    get().validateGraph();
  },

  updateGraphMetadata: (name, task, inputShape) => {
    const updated = {
      ...get().graph,
      name,
      task,
      input_shape: inputShape,
    };
    set({ graph: updated, isDirty: true });
    get().validateGraph();
  },

  addNode: (node) => {
    const { graph, history, historyIndex } = get();
    const newGraph = {
      ...graph,
      nodes: [...graph.nodes, node],
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGraph);
    set({
      graph: newGraph,
      selectedNodeId: node.id,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
    get().validateGraph();
  },

  updateNodePosition: (id, position) => {
    const { graph } = get();
    const newNodes = graph.nodes.map((n) => (n.id === id ? { ...n, position } : n));
    set({ graph: { ...graph, nodes: newNodes } });
  },

  updateNodeParameters: (id, params) => {
    const { graph } = get();
    const newNodes = graph.nodes.map((n) => (n.id === id ? { ...n, parameters: { ...n.parameters, ...params } } : n));
    const newGraph = { ...graph, nodes: newNodes };
    set({ graph: newGraph, isDirty: true });
    get().validateGraph();
  },

  deleteNode: (id) => {
    const { graph, history, historyIndex, selectedNodeId } = get();
    const newNodes = graph.nodes.filter((n) => n.id !== id);
    const newEdges = graph.edges.filter((e) => e.source !== id && e.target !== id);
    const newGraph = { ...graph, nodes: newNodes, edges: newEdges };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGraph);
    set({
      graph: newGraph,
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
    get().validateGraph();
  },

  addEdge: (edge) => {
    const { graph, history, historyIndex } = get();
    // Prevent duplicate edges
    if (graph.edges.some((e) => e.source === edge.source && e.target === edge.target)) return;
    const newGraph = {
      ...graph,
      edges: [...graph.edges, edge],
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newGraph);
    set({
      graph: newGraph,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
    get().validateGraph();
  },

  deleteEdge: (id) => {
    const { graph } = get();
    const newEdges = graph.edges.filter((e) => e.id !== id);
    set({ graph: { ...graph, edges: newEdges }, isDirty: true });
    get().validateGraph();
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  validateGraph: async () => {
    try {
      const res = await api.validateArchitecture(get().graph);
      set({ validationResult: res });
    } catch {
      // Offline fallback simple validation
      set({ validationResult: null });
    }
  },

  fetchPyTorchCode: async () => {
    try {
      const res = await api.generatePyTorchCode(get().graph);
      set({ pytorchCode: res.code, isCodeModalOpen: true });
    } catch (e: any) {
      alert(`Code generation error: ${e.message}`);
    }
  },

  setCodeModalOpen: (open) => set({ isCodeModalOpen: open }),
  setNeuronModalOpen: (open) => set({ isNeuronModalOpen: open }),

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({ graph: prev, historyIndex: historyIndex - 1, isDirty: true });
      get().validateGraph();
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({ graph: next, historyIndex: historyIndex + 1, isDirty: true });
      get().validateGraph();
    }
  },

  autoLayout: () => {
    const { graph } = get();
    // Clean left-to-right topological layout
    const xSpacing = 180;
    const yCenter = 180;
    const newNodes = graph.nodes.map((node, idx) => ({
      ...node,
      position: { x: 60 + idx * xSpacing, y: yCenter },
    }));
    set({ graph: { ...graph, nodes: newNodes }, isDirty: true });
  },
}));
