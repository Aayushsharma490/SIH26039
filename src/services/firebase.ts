import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, serverTimestamp } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { MineData, SensorLogEntry, EngineStatus } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyC2E-uCZvmwyR6_BCnCbzEIcl-kTXncNZk",
  authDomain: "sih26039.firebaseapp.com",
  databaseURL: "https://sih26039-default-rtdb.firebaseio.com",
  projectId: "sih26039",
  storageBucket: "sih26039.firebasestorage.app",
  messagingSenderId: "461272675284",
  appId: "1:461272675284:web:9b23cdff1473ed5db8dc41",
  measurementId: "G-1BTDBPZTL5"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const rtdb = getDatabase(app);

// Analytics initialization (safe for browser)
export let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }).catch(() => {
    // Optional fallback
  });
}

// Fixed references
const TELEMETRY_REF = ref(rtdb, 'sih26039/telemetry');
const ENGINE_REF = ref(rtdb, 'sih26039/engine');
const LOGS_REF = ref(rtdb, 'sih26039/sensor_logs');

/**
 * Seed telemetry state to Firebase without duplicating logs
 */
export async function seedInitialDataToFirebase(initialState: Partial<MineData>) {
  try {
    const payload = {
      systemOnline: true,
      lastUpdated: new Date().toISOString(),
      engine: initialState.engine,
      zones: initialState.zones,
      rovers: initialState.rovers,
      meshNodes: initialState.meshNodes,
      timestamp: serverTimestamp(),
    };

    await set(TELEMETRY_REF, payload);
    return { success: true };
  } catch (error: any) {
    console.warn('Firebase seed notice:', error?.message || error);
    return { success: false, error: error?.message };
  }
}

/**
 * Push live sensor / engine telemetry update to Firebase
 */
export async function pushTelemetryUpdate(partialData: Record<string, any>) {
  try {
    await set(ref(rtdb, 'sih26039/telemetry/live_feed'), {
      ...partialData,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: any) {
    console.warn('Firebase telemetry push error:', error?.message);
    return { success: false, error: error?.message };
  }
}

/**
 * Push engine status update to Firebase
 */
export async function pushEngineUpdate(engine: EngineStatus) {
  try {
    await set(ENGINE_REF, {
      ...engine,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error: any) {
    console.warn('Firebase engine push error:', error?.message);
    return { success: false, error: error?.message };
  }
}

/**
 * Overwrite or update a single sensor's log in Firebase (1 record per sensor tag)
 */
export async function appendSensorLogToFirebase(log: Omit<SensorLogEntry, 'id'>) {
  try {
    const sensorRef = ref(rtdb, `sih26039/sensor_logs/${log.sensorId}`);
    const entry: SensorLogEntry = {
      ...log,
      id: log.sensorId,
    };
    await set(sensorRef, entry);
    return { success: true, entry };
  } catch (error: any) {
    console.warn('Firebase log update error:', error?.message);
    return { success: false, error: error?.message };
  }
}

/**
 * Reset Firebase sensor logs to EXACTLY 1 log per unique sensor
 */
export async function resetFirebaseLogsToOnePerSensor(cleanLogs: SensorLogEntry[]) {
  try {
    const map: Record<string, SensorLogEntry> = {};
    for (const log of cleanLogs) {
      map[log.sensorId] = {
        ...log,
        id: log.sensorId,
      };
    }
    await set(LOGS_REF, map);
    return { success: true };
  } catch (error: any) {
    console.warn('Firebase reset error:', error?.message);
    return { success: false, error: error?.message };
  }
}

/**
 * Subscribe in real time to Telemetry from Firebase RTDB
 */
export function subscribeToTelemetry(callback: (data: any) => void) {
  const listener = onValue(
    TELEMETRY_REF,
    (snapshot) => {
      const val = snapshot.val();
      if (val) {
        callback(val);
      }
    },
    (err) => {
      console.warn('Firebase Telemetry listener notice:', err.message);
    }
  );

  return () => off(TELEMETRY_REF, 'value', listener);
}

/**
 * Subscribe in real time to Sensor Logs from Firebase RTDB
 * Always deduplicates and enforces exactly 1 record per sensor
 */
export function subscribeToSensorLogs(callback: (logs: SensorLogEntry[]) => void) {
  const listener = onValue(
    LOGS_REF,
    (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const sensorMap = new Map<string, SensorLogEntry>();
        const keys = Object.keys(val);
        for (const k of keys) {
          const item = val[k];
          if (item && item.sensorId) {
            sensorMap.set(item.sensorId, {
              ...item,
              id: item.id || k,
            });
          }
        }
        callback(Array.from(sensorMap.values()));
      }
    },
    (err) => {
      console.warn('Firebase Logs listener notice:', err.message);
    }
  );

  return () => off(LOGS_REF, 'value', listener);
}
