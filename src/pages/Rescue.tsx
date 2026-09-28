import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Video, 
  Battery, 
  Wifi, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Square, 
  Crosshair, 
  Sliders,
  Camera,
  RefreshCw
} from 'lucide-react';

const TEST_VIDEO_SOURCES = [
  { label: 'Tunnel Crawl (Test Stream A)', url: 'https://assets.mixkit.co/videos/preview/mixkit-moving-forward-inside-a-dark-tunnel-4265-large.mp4' },
  { label: 'Industrial Inspection (Test Stream B)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { label: 'Mine Gallery (Test Stream C)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4' }
];

const Rescue: React.FC = () => {
  const { rovers, updateRover, engine } = useStore();
  const rover = rovers['ROVER-01'] || {
    id: 'ROVER-01',
    name: 'FIELD UNIT 01',
    battery: 92,
    signal: 96,
    speed: 4.8,
    temperature: 34.2,
    currentZone: 'Z-A1',
    cameraMode: 'RGB' as const,
    lat: 23.7954,
    lng: 86.4307,
    altitude: -452,
    heading: 58
  };

  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [commandSent, setCommandSent] = useState<string | null>(null);

  const handleCommand = (cmd: string) => {
    setCommandSent(cmd);
    setTimeout(() => {
      setCommandSent(null);
    }, 400);
  };

  const switchMode = (mode: 'RGB' | 'NIGHT_VISION' | 'THERMAL') => {
    updateRover('ROVER-01', { cameraMode: mode });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 pb-12 font-sans">
      
      {/* LEFT - PRIMARY VIDEO INSPECTION STREAM */}
      <div className="flex-1 xl:flex-[3] flex flex-col space-y-4">
        
        {/* Stream Controls Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  High-Definition Optical Inspection Feed
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-mono font-bold">
                  60 FPS LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                UNIT: {rover.name} // SECTOR: {rover.currentZone} // LAT: {rover.lat.toFixed(5)} LNG: {rover.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {/* Camera Filter Modes */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {(['RGB', 'NIGHT_VISION', 'THERMAL'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                  rover.cameraMode === mode
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'RGB' ? 'HD Optical' : mode === 'NIGHT_VISION' ? 'Low-Light IR' : 'Thermal Spectrum'}
              </button>
            ))}
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-300 shadow-md min-h-[280px] sm:min-h-[480px] flex items-center justify-center">
          
          {/* HTML5 Video Stream */}
          <video
            key={TEST_VIDEO_SOURCES[activeVideoIdx].url}
            autoPlay
            loop
            muted
            playsInline
            className={`w-full h-full object-cover transition-all duration-500 ${
              rover.cameraMode === 'NIGHT_VISION'
                ? 'grayscale brightness-125 contrast-125 hue-rotate-120'
                : rover.cameraMode === 'THERMAL'
                ? 'grayscale invert contrast-150 sepia hue-rotate-180'
                : 'brightness-95 contrast-105'
            }`}
            src={TEST_VIDEO_SOURCES[activeVideoIdx].url}
          />

          {/* Tactical Crosshair Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <Crosshair className="w-20 h-20 text-white/40" strokeWidth={1} />
            <div className="absolute w-32 h-32 border border-white/20 rounded-full"></div>
            <div className="absolute w-2 h-2 bg-rose-500 rounded-full"></div>
          </div>

          {/* Top-Left Live Badge & Test Stream Selector */}
          <div className="absolute top-5 left-5 z-20 flex flex-col space-y-2">
            <div className="flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-white text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="font-bold">REC // CH-01</span>
              <span className="text-slate-400">| 1080p 60fps</span>
            </div>

            {/* Test Video Stream Selector dropdown */}
            <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-white text-xs font-mono flex items-center space-x-2">
              <span className="text-slate-400 text-[10px]">FEED:</span>
              <select
                value={activeVideoIdx}
                onChange={(e) => setActiveVideoIdx(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-mono focus:outline-none cursor-pointer"
              >
                {TEST_VIDEO_SOURCES.map((s, idx) => (
                  <option key={idx} value={idx} className="bg-slate-900 text-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom Telemetry HUD Bar */}
          <div className="absolute bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-5 z-20 flex flex-wrap sm:flex-nowrap items-center justify-between bg-slate-900/85 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-slate-700 text-white font-mono text-[11px] sm:text-xs gap-2">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-slate-400 text-[10px] block">POSITION</span>
                <span className="font-bold">{rover.lat.toFixed(5)}°N, {rover.lng.toFixed(5)}°E</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-slate-400 text-[10px] block">DEPTH</span>
                <span className="font-bold">{rover.altitude} M</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">VELOCITY</span>
                <span className="font-bold text-emerald-400">{rover.speed} KM/H</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">ATTITUDE</span>
                <span className="font-bold">PITCH: +2.1° | ROLL: -0.4°</span>
              </div>
              <div className="bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-md text-[11px] font-bold">
                HEADING {rover.heading}°
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT - VEHICLE STATUS & TELEOPERATION CONTROLS */}
      <div className="w-full xl:w-96 flex flex-col space-y-6">
        
        {/* Chassis & Battery Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-200 flex items-center space-x-2">
            <Battery className="w-4 h-4 text-blue-600" />
            <span>Chassis Telemetry</span>
          </h3>

          <div className="space-y-4 pt-4 font-mono text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Battery className="w-4 h-4 text-slate-400" />
                  <span>Battery State of Charge</span>
                </span>
                <span className="font-bold text-slate-800 text-sm">{rover.battery}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${rover.battery}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500 flex items-center space-x-1.5">
                  <Wifi className="w-4 h-4 text-slate-400" />
                  <span>Radio Uplink Signal</span>
                </span>
                <span className="font-bold text-slate-800 text-sm">{rover.signal}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${rover.signal}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-slate-400 block text-[10px]">CORE TEMP</span>
                <span className="text-base font-bold text-slate-800">{rover.temperature.toFixed(1)}°C</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-slate-400 block text-[10px]">ENGINE RPM</span>
                <span className="text-base font-bold text-blue-700">{engine.rpm}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Directional Teleoperation D-Pad */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-200 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-slate-700" />
            <span>Teleoperation Override</span>
          </h3>

          <div className="pt-4">
            <div className="grid grid-cols-3 gap-2.5 mx-auto max-w-[200px] mb-4">
              <div />
              <button
                onPointerDown={() => handleCommand('FORWARD')}
                className={`p-4 rounded-xl border flex items-center justify-center transition shadow-xs ${
                  commandSent === 'FORWARD' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Drive Forward"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onPointerDown={() => handleCommand('LEFT')}
                className={`p-4 rounded-xl border flex items-center justify-center transition shadow-xs ${
                  commandSent === 'LEFT' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Pivot Left"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onPointerDown={() => handleCommand('STOP')}
                className={`p-4 rounded-xl border flex items-center justify-center transition shadow-xs ${
                  commandSent === 'STOP' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200'
                }`}
                title="Emergency Brake"
              >
                <Square className="w-5 h-5" />
              </button>
              <button
                onPointerDown={() => handleCommand('RIGHT')}
                className={`p-4 rounded-xl border flex items-center justify-center transition shadow-xs ${
                  commandSent === 'RIGHT' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Pivot Right"
              >
                <ArrowRight className="w-5 h-5" />
              </button>

              <div />
              <button
                onPointerDown={() => handleCommand('REVERSE')}
                className={`p-4 rounded-xl border flex items-center justify-center transition shadow-xs ${
                  commandSent === 'REVERSE' ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Drive Reverse"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => handleCommand('SNAPSHOT')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture Frame</span>
              </button>
              <button
                onClick={() => handleCommand('RESET_IMU')}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Zero IMU</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Rescue;
