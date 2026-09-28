import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  LogOut, 
  Sliders, 
  AlertTriangle, 
  Power, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  XCircle
} from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { 
    admin, 
    loginAdmin, 
    logoutAdmin, 
    thresholds, 
    updateThresholds, 
    setRescueMode, 
    rescueMode,
    engine, 
    updateEngine,
    seedFirebase,
    sensorLogs
  } = useStore();

  // Login form state
  const [email, setEmail] = useState('gits@admin.in');
  const [password, setPassword] = useState('gits');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Calibration state
  const [methaneLimit, setMethaneLimit] = useState(thresholds.methaneLimit);
  const [coLimit, setCoLimit] = useState(thresholds.coLimit);
  const [tempLimit, setTempLimit] = useState(thresholds.tempLimit);
  const [maxRpm, setMaxRpm] = useState(thresholds.maxEngineRpm);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const success = loginAdmin(email, password);
    if (!success) {
      setLoginError('Invalid credentials. Use email: gits@admin.in and pass: gits');
    }
  };

  const handleSaveThresholds = () => {
    updateThresholds({
      methaneLimit: Number(methaneLimit),
      coLimit: Number(coLimit),
      tempLimit: Number(tempLimit),
      maxEngineRpm: Number(maxRpm)
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleEmergencyKillSwitch = () => {
    if (window.confirm("CONFIRMATION: Immediate emergency engine kill switch. Propulsion will disengage instantly.")) {
      updateEngine({
        active: false,
        status: 'OFFLINE',
        rpm: 0,
        load: 0,
        diagnosticCodes: ['DTC-K01: ADMIN EMERGENCY REMOTE SHUTDOWN']
      });
    }
  };

  const handleReSeedCloud = async () => {
    setIsSyncing(true);
    await seedFirebase();
    setIsSyncing(false);
  };

  // If not logged in, show clean admin login card
  if (!admin?.authenticated) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md mb-4">
              <Lock className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              MinePulse Admin Portal
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Restricted Operations & Safety Calibration Terminal
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Admin Email ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="gits@admin.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="gits"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In to Admin Console</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-400 font-mono">
            Default: <span className="font-bold text-slate-700">gits@admin.in</span> // Pass: <span className="font-bold text-slate-700">gits</span>
          </div>

        </div>
      </div>
    );
  }

  // Logged In Admin View
  return (
    <div className="space-y-8 pb-16 font-sans max-w-5xl mx-auto">
      
      {/* Header bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">
                System Administration & Calibration
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 font-mono">
                SUPERADMIN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Authenticated Session: <span className="font-semibold text-slate-700">{admin.email}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logoutAdmin}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Grid of Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECTION A: SAFETY THRESHOLD CALIBRATIONS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Atmospheric Threshold Controls
                </h3>
              </div>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Methane (CH₄) Safety Cutoff (%)</span>
                  <span className="font-mono font-bold text-blue-600">{methaneLimit}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={methaneLimit}
                  onChange={(e) => setMethaneLimit(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.50% (High Sensitivity)</span>
                  <span>3.00% (Permissible Max)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Carbon Monoxide (CO) Alarm (PPM)</span>
                  <span className="font-mono font-bold text-blue-600">{coLimit} PPM</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="1"
                  value={coLimit}
                  onChange={(e) => setCoLimit(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>15 PPM</span>
                  <span>60 PPM</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Maximum Ambient Temperature (°C)</span>
                  <span className="font-mono font-bold text-blue-600">{tempLimit}°C</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="50"
                  step="0.5"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Motor Governor Max RPM Limit</span>
                  <span className="font-mono font-bold text-blue-600">{maxRpm} RPM</span>
                </div>
                <input
                  type="range"
                  min="1200"
                  max="2800"
                  step="50"
                  value={maxRpm}
                  onChange={(e) => setMaxRpm(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveThresholds}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Apply Calibration Parameters
            </button>
          </div>
        </div>

        {/* SECTION B: EMERGENCY CONTROLS & CLOUD OPERATIONS */}
        <div className="space-y-6 flex flex-col">
          
          {/* Emergency Controls Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Master Field Overrides
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Emergency Extraction Mode</span>
                  <span className="text-[11px] text-slate-500">Over-rev ventilation, engage sirens</span>
                </div>
                <button
                  onClick={() => setRescueMode(!rescueMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                    rescueMode ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {rescueMode ? 'DISENGAGE' : 'ENGAGE'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-rose-50/60 border border-rose-200 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-rose-900 block">Remote Drivetrain Kill Switch</span>
                  <span className="text-[11px] text-rose-600">Instantly cuts motor power ({engine.status})</span>
                </div>
                <button
                  onClick={handleEmergencyKillSwitch}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold font-mono transition flex items-center space-x-1"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>CUTOFF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cloud Synchronization & Ledger Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 mb-4">
              <Database className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-bold text-slate-900">
                Database Ledger & Cloud State
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 font-mono">
                <span className="text-slate-500">Registered Telemetry Records:</span>
                <span className="font-bold text-slate-900">{sensorLogs.length} Records</span>
              </div>
              <div className="flex justify-between items-center py-1 font-mono">
                <span className="text-slate-500">Firebase Synchronization:</span>
                <span className="font-bold text-emerald-600">CONNECTED</span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleReSeedCloud}
                  disabled={isSyncing}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Cloud Schemas</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminPanel;
