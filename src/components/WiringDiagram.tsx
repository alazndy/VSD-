import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../store';
import { X } from 'lucide-react';

const CustomNode = ({ data, isConnectable }: any) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 border-slate-200`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <div className="font-bold text-sm text-slate-800">{data.label}</div>
      <div className="text-xs text-slate-500">{data.typeLabel}</div>
      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function WiringDiagram({ onClose }: { onClose: () => void }) {
  const { cameras, sensors, monitors, wiringNodes, wiringEdges, updateWiring } = useStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(wiringNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(wiringEdges || []);

  // Sync scene items into nodes if they don't exist
  useEffect(() => {
    let newNodes = [...nodes];
    let changed = false;

    const addOrUpdateNode = (id: string, label: string, typeLabel: string, type: string) => {
      const exists = newNodes.find(n => n.id === id);
      if (!exists) {
        newNodes.push({
          id,
          type: 'custom',
          position: { x: Math.random() * 200, y: Math.random() * 200 },
          data: { label, typeLabel, type }
        });
        changed = true;
      }
    };

    Object.values(cameras).forEach(c => addOrUpdateNode(c.id, c.name, 'Camera', 'camera'));
    Object.values(sensors).forEach(s => addOrUpdateNode(s.id, s.name, s.type.toUpperCase() + ' Sensor', 'sensor'));
    Object.values(monitors).forEach(m => addOrUpdateNode(m.id, m.name, 'Monitor', 'monitor'));

    if (changed) {
      setNodes(newNodes);
      updateWiring(newNodes, edges);
    }
  }, [cameras, sensors, monitors]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdges = addEdge(params, edges);
      setEdges(newEdges);
      updateWiring(nodes, newEdges);
    },
    [edges, nodes, updateWiring],
  );

  const handleAddNode = (typeLabel: string, type: string) => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type: 'custom',
      position: { x: 50, y: 50 },
      data: { label: `New ${typeLabel}`, typeLabel, type }
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    updateWiring(newNodes, edges);
  };

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  const saveState = () => {
    updateWiring(nodes, edges);
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col pt-12 pb-0">
      <div className="absolute top-0 left-0 right-0 h-12 bg-surface border-b border-border flex items-center justify-between px-4">
        <h2 className="text-text font-bold text-lg">Wiring & Logic (Node Setup)</h2>
        <button onClick={() => { saveState(); onClose(); }} className="text-text hover:text-accent">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 h-full overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-64 bg-surface border-r border-border p-4 flex flex-col gap-2 overflow-y-auto z-10">
          <h3 className="text-text/70 text-xs font-bold uppercase mb-2">Triggers</h3>
          <button onClick={() => handleAddNode('Trigger', 'trigger')} className="bg-bg hover:bg-accent/20 border border-border p-2 text-sm text-left text-text transition-colors">
            + Reverse Gear Trigger
          </button>
          <button onClick={() => handleAddNode('Trigger', 'trigger')} className="bg-bg hover:bg-accent/20 border border-border p-2 text-sm text-left text-text transition-colors">
            + Left Indicator Trigger
          </button>
          <button onClick={() => handleAddNode('Trigger', 'trigger')} className="bg-bg hover:bg-accent/20 border border-border p-2 text-sm text-left text-text transition-colors">
            + Right Indicator Trigger
          </button>
          
          <h3 className="text-text/70 text-xs font-bold uppercase mb-2 mt-4">ECU / Logic</h3>
          <button onClick={() => handleAddNode('ECU', 'ecu')} className="bg-bg hover:bg-accent/20 border border-border p-2 text-sm text-left text-text transition-colors">
            + Custom Logic Node
          </button>

          <h3 className="text-text/70 text-xs font-bold uppercase mb-2 mt-4">Outputs</h3>
          <button onClick={() => handleAddNode('Alarm', 'alarm')} className="bg-bg hover:bg-accent/20 border border-border p-2 text-sm text-left text-text transition-colors">
            + Buzzer / Alarm
          </button>

          <div className="mt-8 text-xs text-text/50">
            Drag nodes to connect them. Connections represent signal flow (e.g. Reverse Gear {'->'} Camera {'->'} Monitor CH2).
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 h-full relative" onMouseUp={saveState}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-bg"
            colorMode="dark"
          >
            <Controls />
            <MiniMap style={{ height: 100, width: 150 }} />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
