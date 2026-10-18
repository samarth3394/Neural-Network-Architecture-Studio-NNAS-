import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStudioStore } from '../../store/studioStore';
import { LayerNode } from './LayerNode';

export const StudioCanvas: React.FC = () => {
  const graph = useStudioStore((s) => s.graph);
  const addEdge = useStudioStore((s) => s.addEdge);
  const deleteEdge = useStudioStore((s) => s.deleteEdge);
  const updateNodePosition = useStudioStore((s) => s.updateNodePosition);
  const selectNode = useStudioStore((s) => s.selectNode);

  const nodeTypes = useMemo(() => ({ layerNode: LayerNode as any }), []);

  // Convert ArchitectureNode to React Flow Node
  const nodes: Node[] = useMemo(() => {
    return graph.nodes.map((n) => ({
      id: n.id,
      type: 'layerNode',
      position: n.position || { x: 100, y: 180 },
      data: {
        label: n.name || n.type,
        type: n.type,
        parameters: n.parameters || {},
      },
    }));
  }, [graph.nodes]);

  // Convert ArchitectureEdge to React Flow Edge
  const edges: Edge[] = useMemo(() => {
    return graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
    }));
  }, [graph.edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updateNodePosition(change.id, change.position);
        }
      });
    },
    [updateNodePosition]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'remove') {
          deleteEdge(change.id);
        }
      });
    },
    [deleteEdge]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addEdge({
          id: `e_${params.source}_${params.target}`,
          source: params.source,
          target: params.target,
        });
      }
    },
    [addEdge]
  );

  return (
    <div className="relative h-full w-full bg-[#07090e]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => selectNode(null)}
        fitView
        className="canvas-grid"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1c2538" />
        <Controls className="!border-studio-700 !bg-studio-900" />
        <MiniMap
          nodeColor="#3b82f6"
          maskColor="rgba(7, 9, 14, 0.85)"
          className="!border !border-studio-700 !bg-studio-950/80"
        />
      </ReactFlow>
    </div>
  );
};
