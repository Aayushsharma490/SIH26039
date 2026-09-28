import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  LogOut,
  Menu,
  X
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
    logoutAdmin,
    setUserLiveCoords
  } = useStore();

  const navigate = useNavigate();
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleLogout = () => {
    logoutAdmin();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f8fafc] text-slate-800 antialiased pb-16 lg:pb-0">
      
      {/* Emergency Alert Banner */}
      {rescueMode && (
        <div className="bg-rose-600 text-white text-[11px] sm:text-xs font-mono font-bold py-2 px-4 sm:px-6 flex items-center justify-between shadow-xs tracking-wider uppercase z-50">
          <div className="flex items-center space-x-2 truncate">
            <AlertTriangle className="w-4 h-4 animate-bounce shrink-0" />
            <span className="truncate">SAFETY INTERLOCK ACTIVE // ATMOSPHERIC ANOMALY IN PROGRESS</span>
          </div>
          <button 
            onClick={() => setRescueMode(false)}
            className="bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded text-white text-[10px] sm:text-[11px] font-semibold transition shrink-0 ml-2"
          >
            DISENGAGE
          </button>
        </div>
      )}

      {/* Premium Clean White Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 z-40 sticky top-0 shadow-xs">
        
        {/* Left: Brand Identity & Desktop Navigation */}
        <div className="flex items-center space-x-6 xl:space-x-8">
          <NavLink to="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/20 group-hover:bg-blue-700 transition">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 leading-none">
                MinePulse
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
                Mining Field Operations
              </div>
            </div>
          </NavLink>

          <div className="h-6 w-px bg-slate-200 hidden lg:block"></div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink
              to="/"
              className={({ isActive }) => cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
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
                "flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
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
                "flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
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
                "flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
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
                "flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all",
                isActive 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </NavLink>
          </nav>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Simulation Tools */}
          <button
            onClick={simulateEmergency}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Simulate Atmospheric Anomaly"
          >
            <Zap className="w-4 h-4" />
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Clock (desktop/tablet) */}
          <div 
            className="hidden md:block font-mono text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg"
            title={`Last Sync: ${lastSyncTime}`}
          >
            {time}
          </div>

          {/* Emergency Safety Protocol Toggle */}
          <button
            onClick={handleRescueToggle}
            className={cn(
              "px-3 py-1.5 sm:py-2 font-bold text-[11px] sm:text-xs uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1.5 border shadow-xs",
              rescueMode 
                ? "bg-rose-600 text-white border-rose-700 animate-pulse shadow-rose-500/20" 
                : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{rescueMode ? 'RESCUE ACTIVE' : 'OVERRIDE PROTOCOL'}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (Visible on mobile when hamburger toggled) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 shadow-md z-40 animate-fade-in">
          <div className="text-[11px] font-mono font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
            Navigation Menu
          </div>

          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition",
              isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Command Center</span>
          </NavLink>

          <NavLink
            to="/rescue"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition",
              isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Video className="w-4 h-4" />
            <span>Live Video Inspection</span>
          </NavLink>

          <NavLink
            to="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition",
              isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Sensor Logs & Report</span>
          </NavLink>

          <NavLink
            to="/network"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition",
              isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <Network className="w-4 h-4" />
            <span>Mesh Network</span>
          </NavLink>

          <NavLink
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition",
              isActive ? "bg-blue-600 text-white" : "text-blue-700 bg-blue-50/70 border border-blue-200"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Console</span>
          </NavLink>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3 text-xs text-slate-500 font-mono">
            <span>Operator: <strong>{admin?.email || 'Active'}</strong></span>
            <button
              onClick={handleLogout}
              className="text-rose-600 font-semibold hover:text-rose-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Ultra-responsive thumb navigation for phones) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around z-40 shadow-lg">
        <NavLink
          to="/"
          className={({ isActive }) => cn(
            "flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition",
            isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/rescue"
          className={({ isActive }) => cn(
            "flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition",
            isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Video className="w-5 h-5 mb-0.5" />
          <span>Feed</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) => cn(
            "flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition",
            isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/network"
          className={({ isActive }) => cn(
            "flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition",
            isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Network className="w-5 h-5 mb-0.5" />
          <span>Mesh</span>
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) => cn(
            "flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition",
            isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-800"
          )}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span>Admin</span>
        </NavLink>
      </div>

    </div>
  );
};

export default Layout;
