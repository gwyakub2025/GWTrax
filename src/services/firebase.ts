/**
 * GWTrax Firebase Firestore Telematics Database Integration
 * Persistent real-time storage for vehicles, telemetry, geofences, alerts, drivers, and routes.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  getDocFromServer,
  query,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Vehicle, GeofenceZone, FleetAlert } from '../types/fleet.ts';
import { DriverMetrics } from '../utils/driverScoring.ts';
import { RouteWaypoint } from '../utils/routeOptimizer.ts';

// Safe env getter for both Vite browser and Node environments
const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

// Resolve configuration dynamically from environment variables (e.g., on Vercel) or fallback to applet config
export const resolvedFirebaseConfig = {
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || firebaseConfig.projectId,
  appId: getEnv('VITE_FIREBASE_APP_ID') || firebaseConfig.appId,
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || firebaseConfig.apiKey,
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || firebaseConfig.authDomain,
  firestoreDatabaseId:
    getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID') ||
    firebaseConfig.firestoreDatabaseId ||
    '(default)',
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || firebaseConfig.storageBucket,
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || firebaseConfig.messagingSenderId,
};

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(resolvedFirebaseConfig);

// CRITICAL: Connect to custom database ID if specified and not (default), else connect to default database
export const db =
  resolvedFirebaseConfig.firestoreDatabaseId &&
  resolvedFirebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on initial boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or connecting...');
      return false;
    }
    // Non-fatal if test doc isn't written yet
    return true;
  }
}

// --- VEHICLES SERVICE ---
export function subscribeVehicles(
  onData: (vehicles: Vehicle[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'vehicles');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Vehicle[] = [];
      snapshot.forEach((docSnap) => {
        list.push(normalizeFromFirestore(docSnap.data()) as Vehicle);
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'vehicles');
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

// Deep sanitize and convert nested arrays (e.g., coordinates [[lat, lng]]) into Firestore-supported structures
export function prepareForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    // If it's an array of arrays (e.g., [[lat, lng], ...]), convert to [{ lat, lng }, ...]
    if (data.length > 0 && Array.isArray(data[0])) {
      return (data as any[]).map((item) => {
        if (Array.isArray(item) && item.length >= 2) {
          return { lat: item[0], lng: item[1] };
        }
        return prepareForFirestore(item);
      }) as unknown as T;
    }
    return (data as any[]).map(prepareForFirestore) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const res: any = {};
    for (const key of Object.keys(data)) {
      const val = (data as any)[key];
      if (val !== undefined) {
        res[key] = prepareForFirestore(val);
      }
    }
    return res as T;
  }
  return data;
}

// Convert Firestore objects back into client representation
export function normalizeFromFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return (data as any[]).map((item) => {
      if (item && typeof item === 'object' && 'lat' in item && 'lng' in item) {
        return [item.lat, item.lng];
      }
      return normalizeFromFirestore(item);
    }) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const res: any = {};
    for (const key of Object.keys(data)) {
      res[key] = normalizeFromFirestore((data as any)[key]);
    }
    return res as T;
  }
  return data;
}

export function cleanUndefined<T>(data: T): T {
  return prepareForFirestore(data);
}

export async function saveVehicleToFirestore(vehicle: Vehicle): Promise<void> {
  const path = `vehicles/${vehicle.id}`;
  try {
    const sanitized = prepareForFirestore({
      ...vehicle,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(db, 'vehicles', vehicle.id), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateVehicleTelemetryInFirestore(
  vehicleId: string,
  updates: Partial<Vehicle>
): Promise<void> {
  const path = `vehicles/${vehicleId}`;
  try {
    const sanitized = cleanUndefined({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    await updateDoc(doc(db, 'vehicles', vehicleId), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVehicleFromFirestore(vehicleId: string): Promise<void> {
  const path = `vehicles/${vehicleId}`;
  try {
    await deleteDoc(doc(db, 'vehicles', vehicleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- DRIVERS SERVICE ---
export function subscribeDrivers(
  onData: (drivers: DriverMetrics[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'drivers');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: DriverMetrics[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as DriverMetrics);
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'drivers');
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

export async function saveDriverToFirestore(driver: DriverMetrics): Promise<void> {
  const path = `drivers/${driver.driverId}`;
  try {
    await setDoc(doc(db, 'drivers', driver.driverId), cleanUndefined(driver));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDriverFromFirestore(driverId: string): Promise<void> {
  const path = `drivers/${driverId}`;
  try {
    await deleteDoc(doc(db, 'drivers', driverId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- GEOFENCES SERVICE ---
export function subscribeGeofences(
  onData: (geofences: GeofenceZone[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'geofences');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: GeofenceZone[] = [];
      snapshot.forEach((docSnap) => {
        list.push(normalizeFromFirestore(docSnap.data()) as GeofenceZone);
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'geofences');
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

export async function saveGeofenceToFirestore(geofence: GeofenceZone): Promise<void> {
  const path = `geofences/${geofence.id}`;
  try {
    await setDoc(doc(db, 'geofences', geofence.id), cleanUndefined(geofence));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGeofenceFromFirestore(geofenceId: string): Promise<void> {
  const path = `geofences/${geofenceId}`;
  try {
    await deleteDoc(doc(db, 'geofences', geofenceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- ALERTS SERVICE ---
export function subscribeAlerts(
  onData: (alerts: FleetAlert[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, 'alerts');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: FleetAlert[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as FleetAlert);
      });
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'alerts');
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

export async function saveAlertToFirestore(alert: FleetAlert): Promise<void> {
  const path = `alerts/${alert.id}`;
  try {
    await setDoc(doc(db, 'alerts', alert.id), cleanUndefined(alert));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function acknowledgeAlertInFirestore(alertId: string): Promise<void> {
  const path = `alerts/${alertId}`;
  try {
    await updateDoc(doc(db, 'alerts', alertId), {
      acknowledged: true
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAlertFromFirestore(alertId: string): Promise<void> {
  const path = `alerts/${alertId}`;
  try {
    await deleteDoc(doc(db, 'alerts', alertId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- ROUTES SERVICE ---
export async function saveDispatchedRouteToFirestore(routeData: {
  id: string;
  name: string;
  assignedVehicleId: string;
  waypoints: RouteWaypoint[];
  totalDistanceKm: number;
  status: string;
}): Promise<void> {
  const path = `routes/${routeData.id}`;
  try {
    await setDoc(doc(db, 'routes', routeData.id), cleanUndefined({
      ...routeData,
      createdAt: new Date().toISOString()
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- DATABASE UTILITIES: Clear Collections ---
export async function clearCollectionInFirestore(collectionName: string): Promise<number> {
  const colRef = collection(db, collectionName);
  try {
    const snap = await getDocs(colRef);
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
      count++;
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionName);
    return 0;
  }
}
