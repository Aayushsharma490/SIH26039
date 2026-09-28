import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  X, 
  Server, 
  Router, 
  Wifi, 
  Battery, 
  Radio, 
  Send, 
  RotateCcw, 
  Signal, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NodePosition {
  x: number;
  y: number;
}

const MeshNetwork: React.FC = () => {
  const { meshNodes, fluctuateData } = useStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [linkFilter, setLinkFilter] = useState<'ALL' | 'GATEWAY' | 'PEER'>('ALL');
  const [packetBurst, setPacketBurst] = useState(false);
  const [pingTarget, setPingTarget] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Symmetrical constellation layout defaults
  const getDefaultPositions = (width: number, height: number): Record<string, NodePosition> => {
    const cx = Math.max(300, width / 2);
    const cy = Math.max(260, height / 2);
    const r1 = Math.min(width, height) * 0.35; // outer radius

    return {
      'GATEWAY': { x: cx, y: cy },
      'NODE-01': { x: cx - r1 * 0.85, y: cy - r1 * 0.7 },
      'NODE-02': { x: cx + r1 * 0.85, y: cy - r1 * 0.65 },
      'NODE-03': { x: cx + r1 * 0.95, y: cy + r1 * 0.4 },
      'NODE-04': { x: cx + r1 * 0.1, y: cy + r1 * 0.9 },
      'NODE-05': { x: cx - r1 * 0.9, y: cy + r1 * 0.55 },
    };
  };

  const [positions, setPositions] = useState<Record<string, NodePosition>>({
    'GATEWAY': { x: 500, y: 300 },
    'NODE-01': { x: 200, y: 140 },
    'NODE-02': { x: 800, y: 150 },
    'NODE-03': { x: 880, y: 440 },
    'NODE-04': { x: 560, y: 560 },
    'NODE-05': { x: 220, y: 480 },
  });

  // Calculate centered layout on mount
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth > 0 && clientHeight > 0) {
        setPositions(getDefaultPositions(clientWidth, clientHeight));
      }
    }
  }, []);

  // Periodic subtle signal fluctuation
  useEffect(() => {
    const interval = setInterval(fluctuateData, 2200);
    return () => clearInterval(interval);
  }, [fluctuateData]);

  const handleResetLayout = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setPositions(getDefaultPositions(clientWidth, clientHeight));
    }
  };

  const handleTriggerBurst = () => {
    setPacketBurst(true);
    setTimeout(() => setPacketBurst(false), 2400);
  };

  const handlePingNode = (nodeId: string) => {
    setPingTarget(nodeId);
    setPingResult('Pinging node via 868MHz carrier...');
    setTimeout(() => {
      setPingResult(`Echo reply from ${nodeId}: time=14.2ms, RSSI=-68dBm, Link=100%`);
      setTimeout(() => {
        setPingTarget(null);
        setPingResult(null);
      }, 3500);
    }, 600);
  };

  const handleDrag = (id: string, info: any) => {
    setPositions(prev => ({
      ...prev,
      [id]: {
        x: Math.round(prev[id].x + info.delta.x),
        y: Math.round(prev[id].y + info.delta.y)
      }
    }));
  };

  const nodes = Object.values(meshNodes);
  const onlineNodes = nodes.filter(n => n.status === 'ONLINE').length;
  const coverage = Math.round((onlineNodes / nodes.length) * 100);
  const selectedNodeData = selectedNode ? meshNodes[selectedNode] : null;

  // Inter-node links definition
  const links = useMemo(() => {
    return [
      { from: 'GATEWAY', to: 'NODE-01', type: 'GATEWAY', lq: 98, rate: '250 kbps' },
      { from: 'GATEWAY', to: 'NODE-02', type: 'GATEWAY', lq: 96, rate: '250 kbps' },
      { from: 'GATEWAY', to: 'NODE-03', type: 'GATEWAY', lq: 94, rate: '250 kbps' },
      { from: 'GATEWAY', to: 'NODE-04', type: 'GATEWAY', lq: 72, rate: '125 kbps' },
      { from: 'GATEWAY', to: 'NODE-05', type: 'GATEWAY', lq: 95, rate: '250 kbps' },
      { from: 'NODE-01', to: 'NODE-05', type: 'PEER', lq: 88, rate: '125 kbps' },
      { from: 'NODE-04', to: 'NODE-05', type: 'PEER', lq: 82, rate: '125 kbps' },
      { from: 'NODE-02', to: 'NODE-03', type: 'PEER', lq: 91, rate: '250 kbps' },
    ];
  }, []);

  const visibleLinks = links.filter(l => {
    if (linkFilter === 'GATEWAY') return l.type === 'GATEWAY';
    if (linkFilter === 'PEER') return l.type === 'PEER';
    return true;
  });

  const gwPos = positions['GATEWAY'] || { x: 500, y: 300 };

  return (
    <div className="flex flex-col h-full min-h-[900px] relative pb-12 font-sans space-y-6">
      
      {/* Network Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: 'Mesh Nodes Active', value: `${onlineNodes} / ${nodes.length}`, sub: 'RF Sub-GHz 868MHz', status: 'optimal' },
          { label: 'Network Coverage', value: `${coverage}%`, sub: 'All 3 Mining Sectors', status: 'optimal' },
          { label: 'Packet Reliability', value: '99.6%', sub: 'Multi-Hop LoRa Mesh', status: 'optimal' },
          { label: 'Mean Hop Latency', value: '14 ms', sub: 'Low-Jitter Carrier Lock', status: 'optimal' },
          { label: 'Total RF Links', value: `${visibleLinks.length} Active`, sub: 'Redundant Peer Routing', status: 'optimal' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-2">{stat.value}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Interactive Topology Stage */}
      <div 
        className="bg-white border border-slate-200/90 flex-1 flex flex-col relative overflow-hidden rounded-3xl shadow-xs min-h-[620px] select-none" 
        ref={containerRef}
      >
        {/* Radar Propagation Concentric Rings emanating from Gateway */}
        <div 
          className="absolute pointer-events-none rounded-full border border-blue-100/70 -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: gwPos.x, 
            top: gwPos.y, 
            width: 240, 
            height: 240 
          }}
        ></div>
        <div 
          className="absolute pointer-events-none rounded-full border border-blue-100/50 -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: gwPos.x, 
            top: gwPos.y, 
            width: 480, 
            height: 480 
          }}
        ></div>
        <div 
          className="absolute pointer-events-none rounded-full border border-dashed border-slate-200/60 -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: gwPos.x, 
            top: gwPos.y, 
            width: 720, 
            height: 720 
          }}
        ></div>

        {/* Range Labels on Concentric Rings */}
        <div 
          className="absolute pointer-events-none text-[10px] font-mono text-blue-400/80 font-bold -translate-x-1/2"
          style={{ left: gwPos.x, top: Math.max(10, gwPos.y - 120) }}
        >
          100M DRIFT ZONE
        </div>
        <div 
          className="absolute pointer-events-none text-[10px] font-mono text-blue-400/60 font-bold -translate-x-1/2"
          style={{ left: gwPos.x, top: Math.max(10, gwPos.y - 240) }}
        >
          250M INTER-SECTOR RANGE
        </div>

        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)', 
            backgroundSize: '28px 28px' 
          }}
        ></div>

        {/* Top Topology Controls Bar */}
        <div className="absolute top-4 inset-x-4 sm:top-6 sm:inset-x-6 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
          
          <div className="flex items-center space-x-2 bg-white/95 border border-slate-200/90 px-3.5 py-1.5 rounded-2xl shadow-xs backdrop-blur-md">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 tracking-wide">
              LoRa Sub-GHz RF Mesh
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
              868.3 MHz
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter buttons */}
            <div className="flex items-center space-x-1 bg-white/95 border border-slate-200/90 p-1 rounded-2xl shadow-xs backdrop-blur-md">
              <Layers className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
              {(['ALL', 'GATEWAY', 'PEER'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setLinkFilter(filter)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-xl transition cursor-pointer ${
                    linkFilter === filter 
                      ? 'bg-slate-900 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {filter === 'ALL' ? 'All Links' : filter === 'GATEWAY' ? 'Gateway Direct' : 'Peer Relay'}
                </button>
              ))}
            </div>

            <button
              onClick={handleTriggerBurst}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Transmit simulated data packet burst across network"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Packet Burst</span>
            </button>

            <button
              onClick={handleResetLayout}
              className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/90 rounded-2xl shadow-xs transition cursor-pointer"
              title="Auto-Center & Symmetrical Constellation Layout"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SVG Network Link Lines & Animated Signal Pulses */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            {/* Gradient for Gateway links */}
            <linearGradient id="link-gradient-active" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="link-gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
            </linearGradient>

            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {visibleLinks.map((link, idx) => {
            const p1 = positions[link.from];
            const p2 = positions[link.to];
            if (!p1 || !p2) return null;

            const isWarning = meshNodes[link.to]?.status === 'DEGRADED';
            const strokeColor = isWarning ? '#d97706' : link.type === 'GATEWAY' ? '#2563eb' : '#0284c7';

            return (
              <g key={idx}>
                {/* Background link halo */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth={link.type === 'GATEWAY' ? 4 : 2.5}
                  strokeOpacity={0.12}
                />

                {/* Primary transmission line */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={strokeColor}
                  strokeWidth={link.type === 'GATEWAY' ? 2 : 1.5}
                  strokeDasharray={link.type === 'GATEWAY' ? '8 6' : '6 6'}
                  strokeOpacity={0.7}
                  className="transition-all duration-300"
                />

                {/* Animated data packet traveling between nodes */}
                <circle r={packetBurst ? 4.5 : 3} fill={isWarning ? '#f59e0b' : '#38bdf8'}>
                  <animateMotion
                    path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    dur={packetBurst ? "0.8s" : "2.2s"}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Return trip packet for bi-directional flow */}
                <circle r={2.5} fill="#60a5fa" opacity={0.8}>
                  <animateMotion
                    path={`M ${p2.x} ${p2.y} L ${p1.x} ${p1.y}`}
                    dur={packetBurst ? "1.1s" : "3.0s"}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </svg>

        {/* Draggable High-Tech Node Cards */}
        {Object.entries(meshNodes).map(([id, node]) => {
          const isGateway = id === 'GATEWAY';
          const pos = positions[id] || { x: 300, y: 300 };
          const isSelected = selectedNode === id;
          const isDegraded = node.status === 'DEGRADED';
          const isOffline = node.status === 'OFFLINE';

          // Assign realistic sensor role
          const roleLabel = isGateway 
            ? 'SURFACE GATEWAY' 
            : id === 'NODE-01' 
            ? 'FIELD UNIT CRAWLER' 
            : id === 'NODE-02' 
            ? 'METHANE SENSOR CLUSTER' 
            : id === 'NODE-03' 
            ? 'AIRWAY REPEATER' 
            : id === 'NODE-04' 
            ? 'SUB-STATION MONITOR' 
            : 'VENTILATION RELAY';

          return (
            <motion.div
              key={id}
              drag
              dragConstraints={containerRef}
              dragElastic={0.06}
              dragMomentum={false}
              onDrag={(_e, info) => handleDrag(id, info)}
              onClick={() => setSelectedNode(id)}
              className="absolute z-10 cursor-grab active:cursor-grabbing flex flex-col items-center group touch-none"
              style={{ 
                x: pos.x - (isGateway ? 42 : 36),
                y: pos.y - (isGateway ? 42 : 36)
              }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Outer pulsing beacon ring for active RF */}
              <div className="relative">
                {node.status === 'ONLINE' && (
                  <div className={`absolute -inset-2 rounded-3xl opacity-25 animate-ping pointer-events-none ${
                    isGateway ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}></div>
                )}

                {/* Node Box */}
                <div className={`rounded-3xl flex items-center justify-center transition-all bg-white border-2 shadow-md relative overflow-hidden ${
                  isGateway 
                    ? 'w-21 h-21 border-blue-600 ring-4 ring-blue-100 shadow-blue-500/20' 
                    : 'w-18 h-18'
                } ${
                  isSelected 
                    ? 'ring-4 ring-blue-500 border-blue-600 scale-105' 
                    : isOffline 
                    ? 'border-rose-500 bg-rose-50/50' 
                    : isDegraded 
                    ? 'border-amber-500' 
                    : 'border-slate-300 hover:border-blue-400'
                }`}>
                  
                  {isGateway ? (
                    <div className="flex flex-col items-center justify-center text-blue-600">
                      <Server className="w-8 h-8" />
                      <span className="text-[9px] font-extrabold font-mono text-blue-700 tracking-tighter mt-0.5">HUB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Router className={`w-6 h-6 ${
                        isOffline ? 'text-rose-500' : isDegraded ? 'text-amber-500' : 'text-blue-600'
                      }`} />
                      
                      {/* RSSI Signal 4-bar indicator graphic */}
                      <div className="flex items-end space-x-0.5 mt-1">
                        <span className={`w-1 rounded-xs ${node.signal > 20 ? 'bg-emerald-500 h-1.5' : 'bg-slate-200 h-1.5'}`}></span>
                        <span className={`w-1 rounded-xs ${node.signal > 50 ? 'bg-emerald-500 h-2.5' : 'bg-slate-200 h-2.5'}`}></span>
                        <span className={`w-1 rounded-xs ${node.signal > 75 ? 'bg-emerald-500 h-3.5' : 'bg-slate-200 h-3.5'}`}></span>
                        <span className={`w-1 rounded-xs ${node.signal > 88 ? 'bg-emerald-500 h-4' : 'bg-slate-200 h-4'}`}></span>
                      </div>
                    </div>
                  )}

                  {/* Battery corner dot */}
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                    node.battery > 50 ? 'bg-emerald-500' : node.battery > 25 ? 'bg-amber-500' : 'bg-rose-500'
                  }`} title={`Battery: ${node.battery}%`}></div>
                </div>
              </div>

              {/* Node Label Capsule */}
              <div className="mt-2.5 flex flex-col items-center pointer-events-none">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border font-mono shadow-xs whitespace-nowrap ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : isGateway
                    ? 'bg-slate-900 text-white border-slate-900'
                    : isDegraded 
                    ? 'bg-amber-50 text-amber-800 border-amber-300' 
                    : isOffline
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-white text-slate-800 border-slate-200'
                }`}>
                  {id}
                </span>

                <span className="text-[9px] font-bold font-sans text-slate-400 mt-0.5 tracking-tight uppercase">
                  {roleLabel}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Selected Node Details Drawer */}
        <AnimatePresence>
          {selectedNodeData && (
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              className="absolute top-20 left-4 sm:left-6 w-84 max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-xl z-30 font-sans"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                    {selectedNodeData.id === 'GATEWAY' ? <Server className="w-5 h-5" /> : <Router className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base">{selectedNodeData.id}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      MAC: 0x868:F4:{selectedNodeData.id.slice(-2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status pill */}
              <div className="mb-4 flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  selectedNodeData.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  selectedNodeData.status === 'DEGRADED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  STATUS: {selectedNodeData.status}
                </span>

                <span className="text-[11px] font-mono text-slate-400">
                  {selectedNodeData.type} NODE
                </span>
              </div>

              {/* Hardware & Link Metrics */}
              <div className="space-y-3 font-mono text-xs">
                
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500 flex items-center space-x-1.5 font-sans">
                      <Signal className="w-3.5 h-3.5 text-blue-600" />
                      <span>Radio Signal RSSI</span>
                    </span>
                    <span className="font-bold text-slate-800">{selectedNodeData.signal}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedNodeData.signal > 70 ? 'bg-emerald-500' : selectedNodeData.signal > 40 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${selectedNodeData.signal}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>-92 dBm noise</span>
                    <span>-64 dBm carrier</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 font-sans uppercase">Battery Level</div>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <Battery className="w-4 h-4 text-emerald-600" />
                      <span className="text-base font-bold text-slate-900">{selectedNodeData.battery}%</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 font-sans uppercase">Active Peers</div>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <Wifi className="w-4 h-4 text-blue-600" />
                      <span className="text-base font-bold text-slate-900">{selectedNodeData.connectedNodes} Hops</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-slate-700">
                  <span className="font-sans text-slate-500">Last Telemetry Heartbeat:</span>
                  <span className="font-bold text-blue-600">{selectedNodeData.lastPacket}</span>
                </div>

                {/* Ping Result Feedback */}
                {pingResult && pingTarget === selectedNodeData.id && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-[11px] rounded-2xl font-mono animate-fade-in">
                    {pingResult}
                  </div>
                )}

                {/* Ping Node Tool Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handlePingNode(selectedNodeData.id)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ping RF Node ({selectedNodeData.id})</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom subtle hint */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 pointer-events-none z-10 hidden sm:flex items-center space-x-2 text-xs font-semibold text-slate-400 bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span>Click any node to open RF diagnostics • Drag to reposition</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>

      </div>

    </div>
  );
};

export default MeshNetwork;
