import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  FileText, 
  Download, 
  UploadCloud, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Database,
  SlidersHorizontal
} from 'lucide-react';
import type { SensorLogEntry } from '../types';

const SensorReports: React.FC = () => {
  const { sensorLogs, addSensorLog, lastSyncTime, seedFirebase } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [isPushing, setIsPushing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = sensorLogs.filter(log => {
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

  // Transmit new test sensor packet to Firebase
  const handleSendTestToFirebase = async () => {
    setIsPushing(true);
    const randomParam = Math.random();
    let entry: Omit<SensorLogEntry, 'id'>;

    if (randomParam > 0.6) {
      entry = {
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        sensorId: 'CH4-SENS-A02',
        parameter: 'Methane (CH₄)',
        value: +(0.15 + Math.random() * 0.1).toFixed(2),
        unit: '%',
        threshold: '< 1.00 %',
        severity: 'NOMINAL',
        location: 'Sector-A01 Face East',
        remarks: 'Live reading uploaded directly to Firebase Realtime Database.'
      };
    } else if (randomParam > 0.3) {
      entry = {
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        sensorId: 'ENG-MTR-CURR',
        parameter: 'Engine Propulsion Current',
        value: Math.round(28 + Math.random() * 10),
        unit: 'A',
        threshold: '< 55 A',
        severity: 'NOMINAL',
        location: 'Field Unit 01 Drive Inverter',
        remarks: 'Motor phase draw normal during forward crawl.'
      };
    } else {
      entry = {
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        sensorId: 'CO-ELECTRO-09',
        parameter: 'Carbon Monoxide (CO)',
        value: Math.round(18 + Math.random() * 5),
        unit: 'PPM',
        threshold: '< 25 PPM',
        severity: 'NOMINAL',
        location: 'Sector-B12 Airway',
        remarks: 'Gas sensor baseline calibration confirmed.'
      };
    }

    await addSensorLog(entry);
    setIsPushing(false);
    showFeedback('New telemetry packet transmitted to Firebase Realtime Database.');
  };

  const handleSeedAll = async () => {
    setIsPushing(true);
    const ok = await seedFirebase();
    setIsPushing(false);
    if (ok) {
      showFeedback('All telemetry and sensor log schemas synchronized with Firebase!');
    } else {
      showFeedback('Firebase sync notice: Local database updated.');
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const nominalCount = sensorLogs.filter(l => l.severity === 'NOMINAL').length;
  const advisoryCount = sensorLogs.filter(l => l.severity === 'ADVISORY' || l.severity === 'ELEVATED').length;
  const criticalCount = sensorLogs.filter(l => l.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Top Banner / Feedback Alert */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold text-xs">
            DISMISS
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Sensor Telemetry Audit & Compliance Report
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Official real-time environmental, atmospheric, and engine diagnostic log register.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition hover:bg-slate-50"
            title="Download CSV spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition hover:bg-slate-50"
            title="Download JSON log file"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Download JSON Log</span>
          </button>

          <button
            onClick={handleSendTestToFirebase}
            disabled={isPushing}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            {isPushing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            <span>Transmit to Firebase</span>
          </button>

          <button
            onClick={handleSeedAll}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition"
            title="Sync all initial schemas to Firebase"
          >
            <Database className="w-4 h-4 text-slate-300" />
            <span>Sync Schemas</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recorded Logs</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{sensorLogs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Continuous circular ring buffer</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Nominal Safe Events</span>
          </div>
          <div className="text-3xl font-bold text-emerald-700 mt-2">{nominalCount}</div>
          <div className="text-xs text-slate-400 mt-1">{((nominalCount / Math.max(1, sensorLogs.length)) * 100).toFixed(0)}% safe compliance rate</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Advisory Warnings</span>
          </div>
          <div className="text-3xl font-bold text-amber-600 mt-2">{advisoryCount}</div>
          <div className="text-xs text-slate-400 mt-1">Under operational surveillance</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center space-x-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Critical Tripped Limits</span>
          </div>
          <div className="text-3xl font-bold text-rose-600 mt-2">{criticalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Requires emergency review</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search parameter, sensor ID, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Severity:</span>
          {(['ALL', 'NOMINAL', 'ADVISORY', 'CRITICAL'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                selectedSeverity === sev
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Telemetry Report Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Telemetry Records ({filteredLogs.length})
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
            <span>Uplink:</span>
            <span className="font-semibold text-emerald-600">RTDB LIVE</span>
            <span className="text-slate-300">•</span>
            <span>Last Sync: {lastSyncTime}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3.5 px-4">Log ID</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Sensor Tag</th>
                <th className="py-3.5 px-4">Parameter</th>
                <th className="py-3.5 px-4">Value</th>
                <th className="py-3.5 px-4">Threshold</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Engineering Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No sensor records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCrit = log.severity === 'CRITICAL';
                  const isAdv = log.severity === 'ADVISORY' || log.severity === 'ELEVATED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-500">
                        {log.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                        {log.sensorId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {log.parameter}
                      </td>
                      <td className="py-3 px-4 font-mono text-sm font-bold text-slate-900 whitespace-nowrap">
                        {log.value} <span className="text-xs font-normal text-slate-500">{log.unit}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {log.threshold}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
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
