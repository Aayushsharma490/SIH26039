export type Severity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SAFE' | 'NOMINAL' | 'ADVISORY' | 'ELEVATED';

export interface Zone {
  id: string;
  name: string;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  riskScore: number;
  methane: number; // %
  temperature: number; // °C
  co: number; // PPM
  humidity: number; // %
  airQuality: string;
  lat: number;
  lng: number;
}

export interface Rover {
  id: string;
  name: string;
  battery: number;
  signal: number;
  speed: number; // km/h
  temperature: number; // °C
  gasStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
  currentZone: string;
  lat: number;
  lng: number;
  altitude: number; // meters
  heading: number; // degrees
  cameraMode: 'RGB' | 'NIGHT_VISION' | 'THERMAL';
}

export interface EngineStatus {
  active: boolean;
  status: 'ONLINE' | 'STANDBY' | 'CRITICAL' | 'OFFLINE';
  rpm: number;
  load: number; // %
  coolantTemp: number; // °C
  batteryVoltage: number; // V
  fuelCellLevel: number; // %
  throttle: number; // %
  gearMode: 'DRIVE' | 'PARK' | 'REVERSE' | 'NEUTRAL';
  oilPressure: number; // PSI
  operatingHours: number;
  diagnosticCodes: string[];
}

export interface SensorLogEntry {
  id: string;
  timestamp: string;
  sensorId: string;
  parameter: string;
  value: number | string;
  unit: string;
  threshold: string;
  severity: 'NOMINAL' | 'ADVISORY' | 'ELEVATED' | 'CRITICAL';
  location: string;
  remarks: string;
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SAFE';
  message: string;
  zone: string;
  timestamp: string;
  status: 'ACTIVE' | 'RESOLVED';
}

export interface MeshNode {
  id: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  signal: number;
  battery: number;
  connectedNodes: number;
  lastPacket: string;
  type: 'GATEWAY' | 'ROVER' | 'SENSOR';
}

export interface MineData {
  systemOnline: boolean;
  rescueMode: boolean;
  firebaseConnected: boolean;
  lastSyncTime: string;
  engine: EngineStatus;
  zones: Record<string, Zone>;
  rovers: Record<string, Rover>;
  alerts: Alert[];
  meshNodes: Record<string, MeshNode>;
  sensorLogs: SensorLogEntry[];
}
