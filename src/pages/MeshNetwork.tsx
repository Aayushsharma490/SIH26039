import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Activity, X, Server, Router } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MeshNetwork: React.FC = () => {
  const { meshNodes, fluctuateData } = useStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Initial node layout
  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({
    'GATEWAY': { x: 500, y: 300 },
    'NODE-01': { x: 220, y: 160 },
    'NODE-02': { x: 780, y: 180 },
    'NODE-03': { x: 880, y: 420 },
    'NODE-04': { x: 680, y: 550 },
    'NODE-05': { x: 280, y: 520 },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(fluctuateData, 2000);
    return () => clearInterval(interval);
  }, [fluctuateData]);

  const handleDrag = (id: string, info: any) => {
    setPositions(prev => ({
      ...prev,
      [id]: {
        x: prev[id].x + info.delta.x,
        y: prev[id].y + info.delta.y
      }
    }));
  };

  const nodes = Object.values(meshNodes);
  const onlineNodes = nodes.filter(n => n.status === 'ONLINE').length;
  const coverage = Math.round((onlineNodes / nodes.length) * 100);
  const selectedNodeData = selectedNode ? meshNodes[selectedNode] : null;

  return (
    <div className="flex flex-col h-full min-h-[850px] relative pb-12 font-sans space-y-6">
      
      {/* Network Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Mesh Nodes', value: nodes.length, detail: 'RF Sub-GHz 868MHz' },
          { label: 'Online Nodes', value: onlineNodes, detail: '100% active routing' },
          { label: 'Network Coverage', value: `${coverage}%`, detail: 'All 3 mining sectors' },
          { label: 'Packet Delivery', value: '99.4%', detail: 'Hop redundancy 3x' },
          { label: 'Mean Hop Latency', value: '18 ms', detail: 'Low jitter carrier' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
            <div className="text-3xl font-extrabold font-mono text-slate-900 mt-2">{stat.value}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{stat.detail}</div>
          </div>
        ))}
      </div>

      {/* Main Graph Area */}
      <div 
        className="bg-white border border-slate-200 flex-1 flex flex-col relative overflow-hidden rounded-2xl shadow-sm min-h-[550px]" 
        ref={containerRef}
      >
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
          }}
        ></div>

        <div className="absolute top-6 right-6 flex items-center space-x-2 bg-white/90 border border-slate-200 px-4 py-2 rounded-xl text-xs text-slate-600 font-semibold shadow-xs backdrop-blur-sm z-10">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Interactive Topology: Drag nodes to test link elasticity</span>
        </div>

        {/* SVG Link lines between nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Gateway links */}
          {['NODE-01', 'NODE-02', 'NODE-03', 'NODE-04', 'NODE-05'].map(nodeKey => {
            const n = meshNodes[nodeKey];
            if (!n || !positions[nodeKey] || !positions['GATEWAY']) return null;
            const strokeColor = n.status === 'ONLINE' ? '#2563eb' : n.status === 'DEGRADED' ? '#d97706' : '#dc2626';

            return (
              <line
                key={nodeKey}
                x1={positions['GATEWAY'].x}
                y1={positions['GATEWAY'].y}
                x2={positions[nodeKey].x}
                y2={positions[nodeKey].y}
                stroke={strokeColor}
                strokeWidth={n.status === 'ONLINE' ? 2 : 1.5}
                strokeDasharray={n.status === 'ONLINE' ? '6 4' : '4 4'}
                opacity={0.6}
              />
            );
          })}

          {/* Cross mesh redundancy */}
          {positions['NODE-01'] && positions['NODE-05'] && (
            <line
              x1={positions['NODE-01'].x}
              y1={positions['NODE-01'].y}
              x2={positions['NODE-05'].x}
              y2={positions['NODE-05'].y}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              opacity={0.4}
            />
          )}
          {positions['NODE-04'] && positions['NODE-05'] && (
            <line
              x1={positions['NODE-04'].x}
              y1={positions['NODE-04'].y}
              x2={positions['NODE-05'].x}
              y2={positions['NODE-05'].y}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              opacity={0.4}
            />
          )}
        </svg>

        {/* Draggable Nodes */}
        {Object.entries(meshNodes).map(([id, node]) => (
          <motion.div
            key={id}
            drag
            dragConstraints={containerRef}
            dragElastic={0.08}
            dragMomentum={false}
            onDrag={(_e, info) => handleDrag(id, info)}
            onClick={() => setSelectedNode(id)}
            className="absolute z-10 cursor-grab active:cursor-grabbing flex flex-col items-center select-none"
            style={{ 
              x: positions[id]?.x ? positions[id].x - 28 : 200,
              y: positions[id]?.y ? positions[id].y - 28 : 200
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all bg-white border-2 shadow-md ${
              selectedNode === id ? 'ring-4 ring-blue-200 border-blue-600' :
              node.status === 'ONLINE' ? 'border-blue-500' :
              node.status === 'DEGRADED' ? 'border-amber-500' :
              'border-rose-600'
            }`}>
              {id === 'GATEWAY' ? (
                <Server className="w-6 h-6 text-blue-700" />
              ) : (
                <Router className={`w-6 h-6 ${node.status === 'ONLINE' ? 'text-blue-600' : node.status === 'DEGRADED' ? 'text-amber-600' : 'text-rose-600'}`} />
              )}
            </div>

            <div className="mt-2 flex flex-col items-center">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border font-mono shadow-xs ${
                selectedNode === id ? 'bg-slate-900 text-white border-slate-900' :
                node.status === 'ONLINE' ? 'bg-white text-slate-800 border-slate-200' :
                node.status === 'DEGRADED' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {id}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Selected Node Details Drawer */}
        <AnimatePresence>
          {selectedNodeData && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute top-6 left-6 w-80 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl z-30 font-sans"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                    {selectedNodeData.id === 'GATEWAY' ? <Server className="w-5 h-5" /> : <Router className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{selectedNodeData.id}</h4>
                    <span className="text-xs text-slate-500 font-mono uppercase">{selectedNodeData.type} Node</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Node Status:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    selectedNodeData.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-800' :
                    selectedNodeData.status === 'DEGRADED' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedNodeData.status}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Signal RSSI:</span>
                  <span className="font-bold text-slate-800">{selectedNodeData.signal}%</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Battery Level:</span>
                  <span className="font-bold text-slate-800">{selectedNodeData.battery}%</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Active Peer Links:</span>
                  <span className="font-bold text-blue-700">{selectedNodeData.connectedNodes} Neighbors</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Last Telemetry Heartbeat:</span>
                  <span className="font-bold text-slate-800">{selectedNodeData.lastPacket}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default MeshNetwork;
