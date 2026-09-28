import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, off, serverTimestamp } from 'firebase/database';
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

// Analytics initialization (safe for SSR/non-browser)
export let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics optional fallback
  });
}

// References
const TELEMETRY_REF = ref(rtdb, 'sih26039/telemetry');
const ENGINE_REF = ref(rtdb, 'sih26039/engine');
const LOGS_REF = ref(rtdb, 'sih26039/sensor_logs');

/**
 * Seed initial real-time telemetry and engine data to Firebase Realtime Database
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
    
    // Also push an initial log batch if logs exist
    if (initialState.sensorLogs && initialState.sensorLogs.length > 0) {
      for (const log of initialState.sensorLogs) {
        await push(LOGS_REF, log);
      }
    }
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
 * Append a sensor log report entry to Firebase
 */
export async function appendSensorLogToFirebase(log: Omit<SensorLogEntry, 'id'>) {
  try {
    const newLogRef = push(LOGS_REF);
    const entry: SensorLogEntry = {
      ...log,
      id: newLogRef.key || Date.now().toString(),
    };
    await set(newLogRef, entry);
    return { success: true, entry };
  } catch (error: any) {
    console.warn('Firebase log append error:', error?.message);
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
 */
export function subscribeToSensorLogs(callback: (logs: SensorLogEntry[]) => void) {
  const listener = onValue(
    LOGS_REF,
    (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const list: SensorLogEntry[] = Object.keys(val).map((k) => ({
          ...val[k],
          id: k,
        }));
        callback(list.reverse()); // most recent first
      }
    },
    (err) => {
      console.warn('Firebase Logs listener notice:', err.message);
    }
  );

  return () => off(LOGS_REF, 'value', listener);
}
