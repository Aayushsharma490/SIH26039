import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import type { Rover } from '../types';
import { 
  MapPin, 
  Gauge, 
  Thermometer, 
  Wind, 
  Droplets, 
  ShieldCheck, 
  AlertTriangle, 
  Radio, 
  Play, 
  Pause, 
  FileText,
  ArrowUpRight, 
  CheckCircle2, 
  Navigation, 
  Compass, 
  Cpu, 
  Video,
  LocateFixed
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom clean Leaflet Zone Icons
const createZoneIcon = (status: 'SAFE' | 'WARNING' | 'CRITICAL') => {
  const bg = status === 'CRITICAL' ? '#dc2626' : status === 'WARNING' ? '#d97706' : '#059669';
  const pulse = status === 'CRITICAL' || status === 'WARNING';

  return L.divIcon({
    html: `
      <div style="position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center;">
        ${pulse ? `<div style="position:absolute; inset:0; border-radius:50%; background:${bg}; opacity:0.35; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
        <div style="width:14px; height:14px; border-radius:50%; background:${bg}; border:2.5px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.25); z-index:10;"></div>
      </div>
    `,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

// Directional live marker
const createLiveVehicleIcon = (heading: number) => {
  return L.divIcon({
    html: `
      <div style="position:relative; width:38px; height:38px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; inset:-4px; border-radius:50%; border:2px solid #2563eb; opacity:0.4; animation:pulse 2s infinite;"></div>
        <div style="width:28px; height:28px; border-radius:50%; background:#2563eb; border:2.5px solid #ffffff; box-shadow:0 4px 10px rgba(37,99,235,0.4); display:flex; align-items:center; justify-content:center; color:#ffffff; transform: rotate(${heading}deg); transition: transform 0.4s ease;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
        </div>
      </div>
    `,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

// Dynamic Map Recenter component
const MapRecenter: React.FC<{ coords: [number, number], follow: boolean }> = ({ coords, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (follow) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords, follow, map]);
  return null;
};

const Dashboard: React.FC = () => {
  const { 
    zones, 
    rovers, 
    engine, 
    alerts, 
    fluctuateData, 
    toggleEngineActive,
    setUserLiveCoords,
    userLiveCoords,
    thresholds
  } = useStore();

  const [followRover, setFollowRover] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Real-time fluctuation tick
  useEffect(() => {
    const interval = setInterval(fluctuateData, 2000);
    return () => clearInterval(interval);
  }, [fluctuateData]);

  // Request actual user browser geolocation on component mount
  const handleAcquireLocation = () => {
    if ('geolocation' in navigator) {
      setGpsStatus('Locating device...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLiveCoords([lat, lng]);
          setGpsStatus('GPS Locked to Current Location');
          setTimeout(() => setGpsStatus(null), 3500);
        },
        (err) => {
          setGpsStatus('GPS access denied or unavailable');
          setTimeout(() => setGpsStatus(null), 3500);
          console.warn('Geolocation notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGpsStatus('Geolocation not supported in browser');
      setTimeout(() => setGpsStatus(null), 3000);
    }
  };

  const activeRover: Rover = rovers['ROVER-01'] || {
    id: 'ROVER-01',
    name: 'Field Unit 01',
    battery: 92,
    signal: 96,
    speed: 4.8,
    temperature: 34.2,
    lat: userLiveCoords ? userLiveCoords[0] : 23.7954,
    lng: userLiveCoords ? userLiveCoords[1] : 86.4307,
    altitude: -452,
    heading: 45,
    gasStatus: 'SAFE',
    currentZone: 'Z-A1',
    cameraMode: 'RGB'
  };

  const criticalZone = Object.values(zones).find(z => z.status === 'CRITICAL');
  const roverCoords: [number, number] = [activeRover.lat, activeRover.lng];

  return (
    <div className="space-y-7 pb-12 font-sans">
      
      {/* Critical Alert Warning Banner */}
      {criticalZone && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-5 rounded-r-2xl shadow-xs flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-rose-900 uppercase tracking-wide">
                  Atmospheric Anomaly Warning
                </span>
                <span className="text-xs font-mono font-bold bg-rose-200 text-rose-800 px-2 py-0.5 rounded">
                  {criticalZone.name}
                </span>
              </div>
              <p className="text-sm text-rose-700 mt-1">
                Methane concentration spiked to <span className="font-bold">{criticalZone.methane.toFixed(2)}%</span> (Ceiling: {thresholds.methaneLimit.toFixed(2)}%). Auxiliary fans engaged.
              </p>
            </div>
          </div>
          <Link
            to="/reports"
            className="text-xs font-bold text-rose-800 hover:text-rose-950 underline shrink-0 mt-1"
          >
            Review Audit Log →
          </Link>
        </div>
      )}

      {/* SECTION 1: ENGINE & PROPULSION ACTIVE MONITOR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Engine & Propulsion Status
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  engine.active 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {engine.active ? 'ENGINE ACTIVE' : 'ENGINE STANDBY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous field unit electric powertrain and energy telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleEngineActive}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                engine.active 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
              }`}
            >
              {engine.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{engine.active ? 'Put in Standby' : 'Engage Propulsion'}</span>
            </button>
          </div>
        </div>

        {/* Engine Telemetry Gauges */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-5">
          
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Engine RPM</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">{engine.rpm}</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (engine.rpm / thresholds.maxEngineRpm) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
              <span>0</span>
              <span>{thresholds.maxEngineRpm} max</span>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Motor Load</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">{engine.load}%</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${engine.load}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Torque Output: 68 Nm</div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Coolant Temp</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">{engine.coolantTemp}°C</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${engine.coolantTemp > 85 ? 'bg-rose-500' : 'bg-blue-600'}`} 
                style={{ width: `${Math.min(100, (engine.coolantTemp / 110) * 100)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Normal Range &lt; 90°C</div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pack Voltage</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">{engine.batteryVoltage} V</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${((engine.batteryVoltage - 42) / (54.6 - 42)) * 100}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">LiFePO4 16S Pack</div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Drive Mode</div>
            <div className="text-2xl font-bold font-mono text-blue-700 mt-1.5">{engine.gearMode}</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${engine.throttle}%` }}></div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Throttle: {engine.throttle}%</div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Hydraulic PSI</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1.5">{engine.oilPressure}</div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(engine.oilPressure / 60) * 100}%` }}></div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Runtime: {engine.operatingHours}h</div>
          </div>
        </div>

        {/* Diagnostic Codes Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 font-mono gap-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700">ECU DTC:</span>
            {engine.diagnosticCodes.map((code, idx) => (
              <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200 text-[11px]">
                {code}
              </span>
            ))}
          </div>
          <span className="text-emerald-700 font-medium flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Telemetry Certified</span>
          </span>
        </div>
      </div>

      {/* SECTION 2: ATMOSPHERIC & ENVIRONMENTAL SENSORS */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <Wind className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Atmospheric & Environmental Sensors
            </h3>
          </div>
          <Link
            to="/reports"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Sensor Log Register</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Methane (CH₄)',
              value: criticalZone ? criticalZone.methane : 0.18,
              unit: '%',
              limit: `< ${thresholds.methaneLimit.toFixed(2)} %`,
              icon: Wind,
              status: (criticalZone ? criticalZone.methane : 0.18) > thresholds.methaneLimit ? 'CRITICAL' : 'SAFE'
            },
            {
              label: 'Carbon Monoxide (CO)',
              value: criticalZone ? criticalZone.co : 14,
              unit: 'PPM',
              limit: `< ${thresholds.coLimit} PPM`,
              icon: Wind,
              status: (criticalZone ? criticalZone.co : 14) > thresholds.coLimit ? 'ADVISORY' : 'SAFE'
            },
            {
              label: 'Ambient Temp',
              value: criticalZone ? criticalZone.temperature : 24.8,
              unit: '°C',
              limit: `< ${thresholds.tempLimit.toFixed(1)} °C`,
              icon: Thermometer,
              status: (criticalZone ? criticalZone.temperature : 24.8) > thresholds.tempLimit ? 'WARNING' : 'SAFE'
            },
            {
              label: 'Relative Humidity',
              value: criticalZone ? criticalZone.humidity : 48,
              unit: '%',
              limit: '30 - 70 %',
              icon: Droplets,
              status: 'SAFE'
            },
            {
              label: 'Airflow Velocity',
              value: 3.4,
              unit: 'm/s',
              limit: '> 2.0 m/s',
              icon: ShieldCheck,
              status: 'OPTIMAL'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  item.status === 'CRITICAL' 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : item.status === 'ADVISORY' || item.status === 'WARNING'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {item.status}
                </span>
              </div>

              <div className="mt-3">
                <div className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                  {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}{' '}
                  <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">Limit: {item.limit}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: GPS GEOLOCATION & REAL LOCATION TRACKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaflet Map with Live Vehicle Marker */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Live Topographical & GPS Map
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time positioning with live marker and sector boundary monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAcquireLocation}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                title="Detect live browser GPS coordinates"
              >
                <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                <span>My Live GPS Location</span>
              </button>

              <button
                onClick={() => setFollowRover(!followRover)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono border transition ${
                  followRover
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {followRover ? 'LOCKED' : 'FREE PAN'}
              </button>
            </div>
          </div>

          {/* GPS Status feedback */}
          {gpsStatus && (
            <div className="mb-3 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center space-x-2">
              <LocateFixed className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>{gpsStatus}</span>
            </div>
          )}

          {/* Leaflet Map Canvas */}
          <div className="w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200 relative z-0">
            <MapContainer
              center={roverCoords}
              zoom={16}
              className="w-full h-full"
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              <MapRecenter coords={roverCoords} follow={followRover} />

              {/* Sector Markers */}
              {Object.values(zones).map((zone) => {
                const icon = createZoneIcon(zone.status);
                const color = zone.status === 'CRITICAL' ? '#dc2626' : zone.status === 'WARNING' ? '#d97706' : '#059669';

                return (
                  <React.Fragment key={zone.id}>
                    <Marker position={[zone.lat, zone.lng]} icon={icon}>
                      <Popup>
                        <div className="p-1 font-sans">
                          <div className="font-bold text-sm text-slate-900">{zone.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Status: <span className="font-semibold text-slate-800">{zone.status}</span></div>
                          <div className="text-xs text-slate-500 mt-1">
                            CH₄: <span className="font-mono font-bold text-slate-800">{zone.methane}%</span> | Temp: <span className="font-mono font-bold text-slate-800">{zone.temperature}°C</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[zone.lat, zone.lng]}
                      radius={zone.status === 'CRITICAL' ? 140 : 80}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: zone.status === 'CRITICAL' ? 0.2 : 0.08,
                        weight: 1.5
                      }}
                    />
                  </React.Fragment>
                );
              })}

              {/* LIVE VEHICLE / ROVER MARKER */}
              <Marker
                position={roverCoords}
                icon={createLiveVehicleIcon(activeRover.heading)}
              >
                <Popup>
                  <div className="p-1 font-sans">
                    <div className="font-bold text-sm text-blue-700 flex items-center space-x-1">
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{activeRover.name}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 font-mono">
                      LAT: {activeRover.lat.toFixed(5)}<br/>
                      LNG: {activeRover.lng.toFixed(5)}<br/>
                      SPEED: {activeRover.speed} km/h<br/>
                      ALT: {activeRover.altitude}m<br/>
                      HEADING: {activeRover.heading}°
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Floating Live Coordinates HUD */}
            <div className="absolute bottom-4 left-4 z-1000 bg-white/95 backdrop-blur-sm border border-slate-200 px-4 py-2.5 rounded-2xl shadow-sm text-xs font-mono text-slate-700 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-blue-700">
                <Compass className="w-3.5 h-3.5" />
                <span>LIVE POSITION FIX</span>
              </div>
              <div className="text-[11px] text-slate-600">
                LAT: <span className="font-bold">{activeRover.lat.toFixed(6)}°</span> | LNG: <span className="font-bold">{activeRover.lng.toFixed(6)}°</span>
              </div>
              <div className="text-[11px] text-slate-400">
                DEPTH: {activeRover.altitude}m | SPEED: {activeRover.speed} km/h | HEADING: {activeRover.heading}°
              </div>
            </div>
          </div>
        </div>

        {/* Video Peek & Event Stream */}
        <div className="space-y-6 flex flex-col">
          
          {/* Quick Inspection Peek */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Live Camera Feed
                </h4>
              </div>
              <Link to="/rescue" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Full Feed →
              </Link>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-200">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                src="https://assets.mixkit.co/videos/preview/mixkit-moving-forward-inside-a-dark-tunnel-4265-large.mp4"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>CH-01 // 60 FPS</span>
              </div>
              <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                MODE: {activeRover.cameraMode}
              </div>
            </div>
          </div>

          {/* Real-time Event Stream */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Event Stream
                </h4>
              </div>
              <Link to="/reports" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Full Register →
              </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1 font-mono text-xs">
              {alerts.slice(0, 4).map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      a.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      a.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="text-slate-400">{a.timestamp}</span>
                  </div>
                  <p className="text-slate-700 font-sans text-xs leading-relaxed">{a.message}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                to="/reports"
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-xs"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Sensor Audit Report</span>
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;
