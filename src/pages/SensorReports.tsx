import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

const SensorReports: React.FC = () => {
  const { sensorLogs, lastSyncTime, resetLogsToOnePerSensor } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Strictly enforce 1 log per unique sensor tag
  const uniqueLogs = useMemo(() => {
    const map = new Map<string, typeof sensorLogs[0]>();
    for (const log of sensorLogs) {
      if (!map.has(log.sensorId)) {
        map.set(log.sensorId, log);
      }
    }
    return Array.from(map.values());
  }, [sensorLogs]);

  // Filter logs
  const filteredLogs = uniqueLogs.filter(log => {
    const matchesSearch = 
      log.parameter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = selectedSeverity === 'ALL' || log.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Sensor ID', 'Parameter', 'Measured Value', 'Unit', 'Safety Threshold', 'Severity Status', 'Mining Location', 'Engineering Remarks'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.sensorId}"`,
      `"${l.parameter}"`,
      `"${l.value}"`,
      `"${l.unit}"`,
      `"${l.threshold}"`,
      `"${l.severity}"`,
      `"${l.location}"`,
      `"${l.remarks.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetry_sensor_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showFeedback('CSV Report exported and downloaded successfully.');
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sensor_telemetry_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);

    showFeedback('JSON Log file exported and downloaded successfully.');
  };

  // Force clean reset: 1 log per sensor
  const handlePurgeToOnePerSensor = async () => {
    setIsResetting(true);
    await resetLogsToOnePerSensor();
    setIsResetting(false);
    showFeedback('Database cleaned: Exactly 1 active log record maintained per sensor.');
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const nominalCount = uniqueLogs.filter(l => l.severity === 'NOMINAL').length;
  const advisoryCount = uniqueLogs.filter(l => l.severity === 'ADVISORY' || l.severity === 'ELEVATED').length;
  const criticalCount = uniqueLogs.filter(l => l.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-5 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center space-x-3 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs ml-3">
            DISMISS
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sensor Telemetry Audit & Compliance Report
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-time active sensor register maintaining 1 calibrated reading per channel.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition hover:bg-slate-50 cursor-pointer"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Download JSON log file"
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span>Download JSON Log</span>
          </button>

          <button
            onClick={handlePurgeToOnePerSensor}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Clean Firebase RTDB to strictly 1 log per sensor"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-blue-600 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Clean & Keep 1 Log / Sensor</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Sensors</div>
          <div className="text-3xl font-bold font-mono text-slate-900 mt-2">{uniqueLogs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">1 active log per channel</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Nominal Safe</span>
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700 mt-2">{nominalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Within standard OSHA ceiling</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Advisory</span>
          </div>
          <div className="text-3xl font-bold font-mono text-amber-600 mt-2">{advisoryCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Operational notice</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider flex items-center space-x-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Tripped Limits</span>
          </div>
          <div className="text-3xl font-bold font-mono text-rose-600 mt-2">{criticalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Emergency attention</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search parameter, sensor ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">Status:</span>
          {(['ALL', 'NOMINAL', 'ADVISORY', 'CRITICAL'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition shrink-0 ${
                selectedSeverity === sev
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Telemetry Report Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sensor Channel Register ({filteredLogs.length})
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
            <span className="text-emerald-600 font-semibold">1 LOG / SENSOR ACTIVE</span>
            <span className="text-slate-300">•</span>
            <span>Sync: {lastSyncTime}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Sensor Tag</th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Live Reading</th>
                <th className="py-3 px-4">Safety Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Engineering Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No active sensors match your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCrit = log.severity === 'CRITICAL';
                  const isAdv = log.severity === 'ADVISORY' || log.severity === 'ELEVATED';

                  return (
                    <tr key={log.sensorId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900 whitespace-nowrap">
                        {log.sensorId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {log.parameter}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm font-bold text-slate-900 whitespace-nowrap">
                        {log.value} <span className="text-xs font-normal text-slate-500">{log.unit}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {log.threshold}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isCrit
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isAdv
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {log.location}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title={log.remarks}>
                        {log.remarks}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SensorReports;
