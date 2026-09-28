import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  LayoutDashboard, 
  Video, 
  Network, 
  FileText,
  AlertTriangle,
  Zap,
  RotateCcw,
  ShieldCheck,
  Radio,
  UserCheck
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
    simulateEmergency, 
    resetSimulation,
    seedFirebase,
    loadFirebaseTelemetry,
    loadFirebaseLogs,
    lastSyncTime,
    admin,
    setUserLiveCoords
  } = useStore();

  const [time, setTime] = useState(new Date().toLocaleTimeString());

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real device Geolocation capture on load
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLiveCoords([lat, lng]);
        },
        (err) => {
          console.log('Browser geolocation notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [setUserLiveCoords]);

  // Firebase Realtime Listener
  useEffect(() => {
    seedFirebase().catch(() => {});

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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8fafc] text-slate-800 antialiased">
      
      {/* Emergency Strip if active */}
      {rescueMode && (
        <div className="bg-rose-600 text-white text-xs font-mono font-bold py-2 px-6 flex items-center justify-between shadow-sm tracking-wider uppercase z-50">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
            <span>SAFETY INTERLOCK ACTIVE // ATMOSPHERIC ANOMALY IN PROGRESS // ALL CREWS EVACUATE</span>
          </div>
          <button 
            onClick={() => setRescueMode(false)}
            className="bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded text-white text-[11px] font-semibold transition"
          >
            DISENGAGE
          </button>
        </div>
      )}

      {/* Premium Clean White Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 z-40 sticky top-0 shadow-xs">
        
        {/* Left: Modern Clean Brand Identity */}
        <div className="flex items-center space-x-8">
          <NavLink to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                MinePulse
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                Mining Field Operations
              </div>
            </div>
          </NavLink>

          <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>

          {/* Clean Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink
              to="/"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all",
                isActive 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Command Center</span>
            </NavLink>

            <NavLink
              to="/rescue"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all",
                isActive 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Live Video Inspection</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all",
                isActive 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sensor Logs & Report</span>
            </NavLink>

            <NavLink
              to="/network"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all",
                isActive 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Mesh Network</span>
            </NavLink>

            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all",
                isActive 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{admin?.authenticated ? 'Admin Console' : 'Admin Login'}</span>
            </NavLink>
          </nav>
        </div>

        {/* Right Clean Action Cluster */}
        <div className="flex items-center space-x-3">
          
          {/* Admin Tag if logged in */}
          {admin?.authenticated && (
            <NavLink 
              to="/admin"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold font-mono"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>gits@admin.in</span>
            </NavLink>
          )}

          {/* Clean live clock */}
          <div 
            className="hidden sm:block font-mono text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg"
            title={`Last Telemetry Sync: ${lastSyncTime}`}
          >
            {time}
          </div>

          {/* Anomaly simulation tool */}
          <button
            onClick={simulateEmergency}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Simulate Atmospheric Anomaly"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={resetSimulation}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Emergency Safety Protocol Toggle */}
          <button
            onClick={handleRescueToggle}
            className={cn(
              "px-3.5 py-2 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1.5 border shadow-xs",
              rescueMode 
                ? "bg-rose-600 text-white border-rose-700 animate-pulse shadow-rose-500/20" 
                : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{rescueMode ? 'RESCUE ACTIVE' : 'OVERRIDE PROTOCOL'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;
