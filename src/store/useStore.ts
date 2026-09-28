import { create } from 'zustand';
import type { MineData, Zone, Rover, Alert, EngineStatus, SensorLogEntry, SafetyThresholds, AdminUser } from '../types';
import { seedInitialDataToFirebase, appendSensorLogToFirebase, resetFirebaseLogsToOnePerSensor, purgeAndResetFirebase } from '../services/firebase';

interface StoreState extends MineData {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setRescueMode: (status: boolean) => void;
  setFirebaseConnected: (status: boolean) => void;
  updateZone: (zoneId: string, data: Partial<Zone>) => void;
  updateRover: (roverId: string, data: Partial<Rover>) => void;
  updateEngine: (data: Partial<EngineStatus>) => void;
  toggleEngineActive: () => void;
  addAlert: (alert: Alert) => void;
  addSensorLog: (entry: Omit<SensorLogEntry, 'id'>) => Promise<void>;
  resetLogsToOnePerSensor: () => Promise<void>;
  purgeFirebaseData: () => Promise<boolean>;
  seedFirebase: () => Promise<boolean>;
  simulateEmergency: () => void;
  resetSimulation: () => void;
  fluctuateData: () => void;
  loadFirebaseTelemetry: (data: any) => void;
  loadFirebaseLogs: (logs: SensorLogEntry[]) => void;
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  updateThresholds: (data: Partial<SafetyThresholds>) => void;
  setUserLiveCoords: (coords: [number, number]) => void;
}

const initialSensorLogs: SensorLogEntry[] = [
  {
    id: 'LOG-1092',
    timestamp: '2026-09-28 21:05:12',
    sensorId: 'CH4-SENS-01',
    parameter: 'Methane (CH₄)',
    value: 0.12,
    unit: '%',
    threshold: '< 1.00 %',
    severity: 'NOMINAL',
    location: 'Sector-A01 North Drift',
    remarks: 'Atmospheric levels within safety limits.'
  },
  {
    id: 'LOG-1091',
    timestamp: '2026-09-28 21:04:45',
    sensorId: 'ENG-RPM-MTR',
    parameter: 'Engine Speed',
    value: 1450,
    unit: 'RPM',
    threshold: '800 - 2200 RPM',
    severity: 'NOMINAL',
    location: 'Field Unit 01 Chassis',
    remarks: 'Propulsion motor synchronized, torque output 68 Nm.'
  },
  {
    id: 'LOG-1090',
    timestamp: '2026-09-28 21:03:30',
    sensorId: 'CO-ELECTRO-04',
    parameter: 'Carbon Monoxide (CO)',
    value: 24,
    unit: 'PPM',
    threshold: '< 25 PPM',
    severity: 'ADVISORY',
    location: 'Sector-B12 Stope Face',
    remarks: 'Minor accumulation, auxiliary scrubber operational.'
  },
  {
    id: 'LOG-1089',
    timestamp: '2026-09-28 21:02:18',
    sensorId: 'TEMP-RTD-09',
    parameter: 'Core Ambient Temp',
    value: 24.5,
    unit: '°C',
    threshold: '< 35.0 °C',
    severity: 'NOMINAL',
    location: 'Sector-A01 Main Gallery',
    remarks: 'Ventilation current nominal.'
  },
  {
    id: 'LOG-1088',
    timestamp: '2026-09-28 21:00:55',
    sensorId: 'BAT-BMS-CELL',
    parameter: 'Battery Pack Voltage',
    value: 48.6,
    unit: 'V',
    threshold: '42.0 - 54.6 V',
    severity: 'NOMINAL',
    location: 'Field Unit 01 Power Module',
    remarks: 'LiFePO4 balance delta 12mV, temperature 32.1°C.'
  }
];

const getStoredAdmin = (): AdminUser | null => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('minepulse_admin');
      if (stored) return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Error reading stored admin session:', e);
  }
  return null;
};

const initialState: MineData = {
  systemOnline: true,
  rescueMode: false,
  firebaseConnected: true,
  lastSyncTime: new Date().toLocaleTimeString(),
  admin: getStoredAdmin(),
  thresholds: {
    methaneLimit: 1.0,
    coLimit: 25,
    tempLimit: 35.0,
    maxEngineRpm: 2200
  },
  userLiveCoords: null,
  engine: {
    active: true,
    status: 'ONLINE',
    rpm: 1450,
    load: 42,
    coolantTemp: 76.4,
    batteryVoltage: 48.6,
    fuelCellLevel: 92,
    throttle: 35,
    gearMode: 'DRIVE',
    oilPressure: 42.1,
    operatingHours: 184.2,
    diagnosticCodes: [
      'DTC-00: PROPULSION DRIVE NOMINAL',
      'DTC-14: BATTERY BMS CELL EQUILIBRIUM'
    ]
  },
  zones: {
    'Z-A1': {
      id: 'Z-A1',
      name: 'Sector-A01 (Main Gallery)',
      status: 'SAFE',
      riskScore: 12,
      methane: 0.12,
      temperature: 24.5,
      co: 6,
      humidity: 45,
      airQuality: 'EXCELLENT',
      lat: 23.7951,
      lng: 86.4304
    },
    'Z-B12': {
      id: 'Z-B12',
      name: 'Sector-B12 (Extraction Face)',
      status: 'WARNING',
      riskScore: 48,
      methane: 0.85,
      temperature: 31.8,
      co: 24,
      humidity: 58,
      airQuality: 'MODERATE',
      lat: 23.7961,
      lng: 86.4314
    },
    'Z-B14': {
      id: 'Z-B14',
      name: 'Sector-B14 (Return Airway)',
      status: 'SAFE',
      riskScore: 18,
      methane: 0.22,
      temperature: 25.8,
      co: 11,
      humidity: 52,
      airQuality: 'NOMINAL',
      lat: 23.7941,
      lng: 86.4294
    },
  },
  rovers: {
    'ROVER-01': {
      id: 'ROVER-01',
      name: 'Field Unit 01',
      battery: 92,
      signal: 96,
      speed: 4.8,
      temperature: 34.2,
      gasStatus: 'SAFE',
      currentZone: 'Z-A1',
      lat: 23.7954,
      lng: 86.4307,
      altitude: -452,
      heading: 58,
      cameraMode: 'RGB'
    }
  },
  alerts: [
    {
      id: '1',
      severity: 'INFO',
      message: 'System active. Field Unit connected to surface console.',
      zone: 'ALL',
      timestamp: new Date().toLocaleTimeString(),
      status: 'ACTIVE'
    }
  ],
  meshNodes: {
    'GATEWAY': { id: 'GATEWAY', status: 'ONLINE', signal: 100, battery: 100, connectedNodes: 5, lastPacket: '0.1s', type: 'GATEWAY' },
    'NODE-01': { id: 'NODE-01', status: 'ONLINE', signal: 96, battery: 84, connectedNodes: 3, lastPacket: '0.9s', type: 'SENSOR' },
    'NODE-02': { id: 'NODE-02', status: 'ONLINE', signal: 89, battery: 76, connectedNodes: 2, lastPacket: '1.4s', type: 'SENSOR' },
    'NODE-03': { id: 'NODE-03', status: 'ONLINE', signal: 94, battery: 93, connectedNodes: 2, lastPacket: '0.8s', type: 'SENSOR' },
    'NODE-04': { id: 'NODE-04', status: 'DEGRADED', signal: 48, battery: 42, connectedNodes: 1, lastPacket: '3.6s', type: 'SENSOR' },
    'NODE-05': { id: 'NODE-05', status: 'ONLINE', signal: 88, battery: 75, connectedNodes: 2, lastPacket: '1.1s', type: 'SENSOR' },
  },
  sensorLogs: initialSensorLogs
};

export const useStore = create<StoreState>((set, get) => ({
  ...initialState,
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setRescueMode: (status) => set({ rescueMode: status }),
  setFirebaseConnected: (status) => set({ firebaseConnected: status }),

  loginAdmin: (email, pass) => {
    if (email.trim().toLowerCase() === 'gits@admin.in' && pass === 'gits') {
      const adminObj: AdminUser = {
        email: 'gits@admin.in',
        role: 'SUPERADMIN',
        authenticated: true
      };
      try {
        localStorage.setItem('minepulse_admin', JSON.stringify(adminObj));
      } catch (e) {
        console.warn('Could not save session:', e);
      }
      set({ admin: adminObj });
      return true;
    }
    return false;
  },

  logoutAdmin: () => {
    try {
      localStorage.removeItem('minepulse_admin');
    } catch (e) {
      console.warn('Could not remove session:', e);
    }
    set({ admin: null });
  },

  updateThresholds: (data) => set((state) => ({
    thresholds: { ...state.thresholds, ...data }
  })),

  setUserLiveCoords: (coords) => set((state) => {
    // Also position rover and nearby zones around the user's actual location
    const [lat, lng] = coords;
    const updatedRover: Rover = {
      ...state.rovers['ROVER-01'],
      lat,
      lng
    };

    const updatedZones = {
      ...state.zones,
      'Z-A1': { ...state.zones['Z-A1'], lat: +(lat + 0.0005).toFixed(6), lng: +(lng - 0.0004).toFixed(6) },
      'Z-B12': { ...state.zones['Z-B12'], lat: +(lat + 0.0012).toFixed(6), lng: +(lng + 0.0008).toFixed(6) },
      'Z-B14': { ...state.zones['Z-B14'], lat: +(lat - 0.0008).toFixed(6), lng: +(lng - 0.0007).toFixed(6) }
    };

    return {
      userLiveCoords: coords,
      rovers: { ...state.rovers, 'ROVER-01': updatedRover },
      zones: updatedZones
    };
  }),

  updateZone: (zoneId, data) => set((state) => ({
    zones: { ...state.zones, [zoneId]: { ...state.zones[zoneId], ...data } }
  })),

  updateRover: (roverId, data) => set((state) => {
    const updated = { ...state.rovers[roverId], ...data };
    return {
      rovers: { ...state.rovers, [roverId]: updated }
    };
  }),

  updateEngine: (data) => set((state) => {
    const updated = { ...state.engine, ...data };
    return { engine: updated };
  }),

  toggleEngineActive: () => set((state) => {
    const active = !state.engine.active;
    const updated: EngineStatus = {
      ...state.engine,
      active,
      status: active ? 'ONLINE' : 'STANDBY',
      rpm: active ? 1420 : 0,
      load: active ? 35 : 0
    };
    return { engine: updated };
  }),

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 50)
  })),

  addSensorLog: async (entry) => {
    const fullEntry: SensorLogEntry = { ...entry, id: entry.sensorId };
    
    set((state) => {
      const filtered = state.sensorLogs.filter(l => l.sensorId !== entry.sensorId);
      return {
        sensorLogs: [fullEntry, ...filtered]
      };
    });

    await appendSensorLogToFirebase(entry);
  },

  resetLogsToOnePerSensor: async () => {
    await resetFirebaseLogsToOnePerSensor(initialSensorLogs);
    set({ sensorLogs: initialSensorLogs });
  },

  purgeFirebaseData: async () => {
    const state = get();
    const res = await purgeAndResetFirebase(initialSensorLogs, state);
    if (res.success) {
      set({ 
        sensorLogs: initialSensorLogs,
        firebaseConnected: true,
        lastSyncTime: new Date().toLocaleTimeString() 
      });
      return true;
    }
    return false;
  },

  seedFirebase: async () => {
    const state = get();
    const res = await seedInitialDataToFirebase(state);
    if (res.success) {
      set({ firebaseConnected: true, lastSyncTime: new Date().toLocaleTimeString() });
      return true;
    }
    return false;
  },

  loadFirebaseTelemetry: (data) => {
    if (!data) return;
    set((state) => ({
      firebaseConnected: true,
      lastSyncTime: new Date().toLocaleTimeString(),
      engine: data.engine ? { ...state.engine, ...data.engine } : state.engine,
      zones: data.zones ? { ...state.zones, ...data.zones } : state.zones,
      rovers: data.rovers ? { ...state.rovers, ...data.rovers } : state.rovers,
      meshNodes: data.meshNodes ? { ...state.meshNodes, ...data.meshNodes } : state.meshNodes,
    }));
  },

  loadFirebaseLogs: (logs) => {
    if (logs && logs.length > 0) {
      set({ sensorLogs: logs });
    }
  },

  simulateEmergency: () => set((state) => {
    const alert: Alert = {
      id: Date.now().toString(),
      severity: 'CRITICAL',
      message: 'Methane threshold exceeded in Sector-B14 (2.45%). Safety interlock engaged.',
      zone: 'Sector-B14',
      timestamp: new Date().toLocaleTimeString(),
      status: 'ACTIVE'
    };

    const emergencyLog: SensorLogEntry = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      sensorId: 'CH4-SENS-B14',
      parameter: 'Methane (CH₄)',
      value: 2.45,
      unit: '%',
      threshold: `< ${state.thresholds.methaneLimit.toFixed(2)} %`,
      severity: 'CRITICAL',
      location: 'Sector-B14 Return Airway',
      remarks: 'THRESHOLD TRIPPED. Autonomous power cutoff initiated.'
    };

    return {
      zones: {
        ...state.zones,
        'Z-B14': {
          ...state.zones['Z-B14'],
          status: 'CRITICAL',
          riskScore: 94,
          methane: 2.45,
          temperature: 42.1,
          co: 68,
          airQuality: 'DANGEROUS'
        }
      },
      rovers: {
        ...state.rovers,
        'ROVER-01': {
          ...state.rovers['ROVER-01'],
          currentZone: 'Z-B14',
          gasStatus: 'CRITICAL',
          speed: 1.2
        }
      },
      engine: {
        ...state.engine,
        status: 'CRITICAL',
        coolantTemp: 89.2,
        load: 78,
        diagnosticCodes: [
          'DTC-E99: CRITICAL ATMOSPHERE INTERLOCK',
          'DTC-00: PROPULSION DRIVE RUNNING EMERGENCY PROTOCOL'
        ]
      },
      alerts: [alert, ...state.alerts],
      sensorLogs: [emergencyLog, ...state.sensorLogs]
    };
  }),

  resetSimulation: () => set(initialState),

  fluctuateData: () => set((state) => {
    const newZones = { ...state.zones };
    Object.keys(newZones).forEach(key => {
      const z = newZones[key];
      if (z.status !== 'CRITICAL') {
        z.temperature = +(z.temperature + (Math.random() - 0.5) * 0.15).toFixed(1);
        z.methane = +Math.max(0.05, z.methane + (Math.random() - 0.5) * 0.02).toFixed(2);
        z.co = Math.max(1, Math.round(z.co + (Math.random() - 0.5) * 2));
      } else {
        z.temperature = +(z.temperature + (Math.random() - 0.3) * 0.3).toFixed(1);
        z.methane = +Math.min(5, z.methane + (Math.random() - 0.3) * 0.05).toFixed(2);
      }
    });

    let newEngine = { ...state.engine };
    if (newEngine.active) {
      newEngine.rpm = Math.min(state.thresholds.maxEngineRpm, Math.max(900, Math.round(newEngine.rpm + (Math.random() - 0.5) * 35)));
      newEngine.load = Math.min(95, Math.max(20, Math.round(newEngine.load + (Math.random() - 0.5) * 4)));
      newEngine.coolantTemp = +(newEngine.coolantTemp + (Math.random() - 0.5) * 0.1).toFixed(1);
      newEngine.batteryVoltage = +(Math.max(44.0, newEngine.batteryVoltage - 0.001)).toFixed(2);
      newEngine.oilPressure = +(newEngine.oilPressure + (Math.random() - 0.5) * 0.2).toFixed(1);
    }

    const newRovers = { ...state.rovers };
    const r = newRovers['ROVER-01'];
    if (r && newEngine.active) {
      const deltaLat = (Math.random() - 0.49) * 0.00008;
      const deltaLng = (Math.random() - 0.48) * 0.00008;
      r.lat = +(r.lat + deltaLat).toFixed(6);
      r.lng = +(r.lng + deltaLng).toFixed(6);
      r.speed = +(Math.max(0.5, r.speed + (Math.random() - 0.5) * 0.4)).toFixed(1);
      r.heading = (r.heading + Math.floor((Math.random() - 0.5) * 6) + 360) % 360;
    }

    const newMesh = { ...state.meshNodes };
    Object.keys(newMesh).forEach(key => {
      if (newMesh[key].status === 'ONLINE') {
        newMesh[key].signal = Math.min(100, Math.max(82, newMesh[key].signal + Math.floor((Math.random() - 0.5) * 3)));
        newMesh[key].lastPacket = `${(Math.random() * 1.5 + 0.2).toFixed(1)}s`;
      }
    });

    return {
      zones: newZones,
      engine: newEngine,
      rovers: newRovers,
      meshNodes: newMesh,
      lastSyncTime: new Date().toLocaleTimeString()
    };
  })
}));
