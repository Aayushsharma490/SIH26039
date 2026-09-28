import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  Video, 
  Network, 
  FileText,
  AlertTriangle,
  Sun,
  Moon,
  Zap,
  RotateCcw,
  Activity,
  Database,
  CheckCircle2,
  Gauge
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { subscribeToTelemetry, subscribeToSensorLogs } from '../services/firebase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Layout: React.FC = () => {
  const { 
    rescueMode, 
    setRescueMode, 
    theme, 
    toggleTheme, 
    simulateEmergency, 
    resetSimulation,
    engine,
    firebaseConnected,
    seedFirebase,
    loadFirebaseTelemetry,
    loadFirebaseLogs,
    lastSyncTime
  } = useStore();

  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Firebase Realtime Listener
  useEffect(() => {
    // Initial handshake / seed
    seedFirebase().catch(() => {});

    // Subscribe to live Firebase updates
    const unsubTelemetry = subscribeToTelemetry((data) => {
      loadFirebaseTelemetry(data);
    });

    const unsubLogs = subscribeToSensorLogs((logs) => {
      loadFirebaseLogs(logs);
    });

    return () => {
      unsubTelemetry();
      unsubLogs();
    };
  }, [seedFirebase, loadFirebaseTelemetry, loadFirebaseLogs]);

  const handleRescueToggle = () => {
    if (!rescueMode) {
      if (window.confirm("CONFIRMATION: Initiate Emergency Extraction Protocol? All atmospheric fans and rovers will switch to priority evacuation.")) {
        setRescueMode(true);
      }
    } else {
      setRescueMode(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const ok = await seedFirebase();
    setIsSyncing(false);
    setSyncNotice(ok ? 'Firebase RTDB Synchronized' : 'Sync signal sent to Firebase');
    setTimeout(() => setSyncNotice(null), 3500);
  };

  return (
    <div 
      className={cn(
        "min-h-screen flex flex-col font-sans text-slate-800 transition-colors duration-300",
        theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      )}
    >
      {/* Emergency Strip */}
      {rescueMode && (
        <div className="bg-rose-600 text-white text-xs font-mono font-bold py-2 px-6 flex items-center justify-between shadow-md tracking-wider uppercase z-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>SAFETY INTERLOCK ACTIVE // ATMOSPHERIC ANOMALY IN PROGRESS // ALL CREWS STANDBY</span>
          </div>
          <button 
            onClick={() => setRescueMode(false)}
            className="bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded text-white text-[11px] font-semibold transition"
          >
            DISENGAGE OVERRIDE
          </button>
        </div>
      )}

      {/* Top Header - Executive Clean White Theme */}
      <header className="h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-40 sticky top-0 shadow-xs">
        
        {/* Left: Branding & System Name */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white uppercase font-mono">
                  SIH-26039
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                  INDUSTRIAL TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mission Control & Underground Field Unit Terminal
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden xl:block"></div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink
              to="/"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
                isActive 
                  ? "bg-slate-900 text-white dark:bg-blue-600 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Command Center</span>
            </NavLink>

            <NavLink
              to="/rescue"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
                isActive 
                  ? "bg-slate-900 text-white dark:bg-blue-600 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Video className="w-4 h-4" />
              <span>Live Video Inspection</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
                isActive 
                  ? "bg-slate-900 text-white dark:bg-blue-600 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Sensor Logs & Report</span>
            </NavLink>

            <NavLink
              to="/network"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all",
                isActive 
                  ? "bg-slate-900 text-white dark:bg-blue-600 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Network className="w-4 h-4" />
              <span>Mesh Network</span>
            </NavLink>
          </nav>
        </div>

        {/* Right Status Cluster */}
        <div className="flex items-center space-x-3.5">
          
          {/* Real-time Active Indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>REAL-TIME ACTIVE</span>
          </div>

          {/* Engine Active Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-mono font-bold">
            <Gauge className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>ENGINE: {engine.active ? `${engine.rpm} RPM` : 'STANDBY'}</span>
          </div>

          {/* Firebase RTDB Pill & Sync button */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
            title="Push & Sync with Firebase Realtime Database"
          >
            <Database className={cn("w-3.5 h-3.5 text-blue-600 dark:text-blue-400", isSyncing && "animate-spin")} />
            <span className="font-mono text-[11px] hidden xl:inline">Firebase RTDB</span>
            {firebaseConnected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>

          {/* Time display */}
          <div 
            className="hidden xl:block font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md"
            title={`Last Telemetry Sync: ${lastSyncTime}`}
          >
            {time}
          </div>

          {/* Simulation controls */}
          <button
            onClick={simulateEmergency}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
            title="Simulate Atmospheric Anomaly"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={resetSimulation}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Reset Telemetry Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Theme switch */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Emergency Safety Protocol Toggle */}
          <button
            onClick={handleRescueToggle}
            className={cn(
              "px-3.5 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center space-x-2 border shadow-sm",
              rescueMode 
                ? "bg-rose-600 text-white border-rose-700 animate-pulse shadow-rose-500/20" 
                : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">{rescueMode ? 'RESCUE ACTIVE' : 'OVERRIDE PROTOCOL'}</span>
          </button>
        </div>
      </header>

      {/* Sync toast notification */}
      {syncNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
