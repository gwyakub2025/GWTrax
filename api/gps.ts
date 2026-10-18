// Vercel Serverless Function to receive GPS telemetry from Traccar Client & OsmAnd
// Endpoint: https://gwtrax.vercel.app/api/gps

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import { saveTelemetryToMongo } from './lib/mongodb.js';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const config = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: process.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  apiKey: process.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  firestoreDatabaseId:
    process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    firebaseConfig.firestoreDatabaseId ||
    '(default)',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(config);
const db =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse parameters robustly from query string, URL, and body (JSON or form urlencoded)
  let rawParams: Record<string, any> = {};

  if (req.query && typeof req.query === 'object') {
    rawParams = { ...req.query };
  }

  if (req.url && req.url.includes('?')) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      urlObj.searchParams.forEach((val, key) => {
        if (rawParams[key] === undefined) rawParams[key] = val;
      });
    } catch (_) {}
  }

  if (req.body) {
    if (typeof req.body === 'object') {
      rawParams = { ...rawParams, ...req.body };
    } else if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        rawParams = { ...rawParams, ...parsed };
      } catch (_) {
        try {
          const formParams = new URLSearchParams(req.body);
          formParams.forEach((val, key) => {
            if (rawParams[key] === undefined) rawParams[key] = val;
          });
        } catch (_) {}
      }
    }
  }

  const getParam = (keys: string[]) => {
    for (const k of keys) {
      if (rawParams[k] !== undefined && rawParams[k] !== null && rawParams[k] !== '') {
        return rawParams[k];
      }
    }
    return undefined;
  };

  const deviceId = String(getParam(['id', 'device_id', 'imei', 'uniqueId', 'deviceId']) || '0582649777').trim();
  const lat = parseFloat(String(getParam(['lat', 'latitude']) || '0'));
  const lon = parseFloat(String(getParam(['lon', 'lng', 'longitude']) || '0'));
  const speedKnotsOrKmh = parseFloat(String(getParam(['speed']) || '0'));
  // Traccar client reports speed in knots or km/h; convert knots to km/h (1 knot = 1.852 km/h)
  const speedKmh = Math.round(speedKnotsOrKmh > 0 ? speedKnotsOrKmh * 1.852 : 0);
  const bearing = parseFloat(String(getParam(['bearing', 'heading']) || '0'));
  const altitude = parseFloat(String(getParam(['altitude']) || '0'));
  const battery = parseFloat(String(getParam(['batt', 'battery']) || '100'));

  const telemetry = {
    status: 'success',
    message: 'Telemetry received by GWTrax Gateway',
    deviceId,
    latitude: lat,
    longitude: lon,
    speedKmh,
    bearing,
    altitude,
    battery,
    receivedAt: new Date().toISOString()
  };

  // 1. Update live vehicle location in Firebase Firestore
  if (lat !== 0 && lon !== 0) {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      
      // Match vehicle by IMEI, ID, or plate number
      const imeiQuery = query(vehiclesRef, where('deviceInfo.imei', '==', deviceId));
      const imeiSnap = await getDocs(imeiQuery);

      const status = speedKmh > 3 ? 'moving' : 'idle';

      if (!imeiSnap.empty) {
        // Update existing vehicle matched by IMEI
        for (const docSnap of imeiSnap.docs) {
          await updateDoc(doc(db, 'vehicles', docSnap.id), {
            status,
            'location.latitude': lat,
            'location.longitude': lon,
            'location.address': `Live GPS Fix: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
            'telemetry.speedKmh': speedKmh,
            'telemetry.headingDeg': bearing,
            'telemetry.batteryVoltage': Number((battery / 20).toFixed(1)),
            'telemetry.lastPingTime': 'Just now',
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Create or update by doc ID directly
        const docId = `MOB-${deviceId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
        const directDoc = doc(db, 'vehicles', docId);
        await setDoc(directDoc, {
          id: docId,
          plateNumber: `MOB-${deviceId.slice(-4)}`,
          name: `Mobile Phone (${deviceId})`,
          type: 'delivery_van',
          driverId: `drv-${deviceId.slice(-4)}`,
          driverName: 'Mobile Courier',
          status,
          location: {
            latitude: lat,
            longitude: lon,
            address: `Live GPS Fix: ${lat.toFixed(5)}, ${lon.toFixed(5)}`,
            city: 'Live Location',
            country: 'Live'
          },
          telemetry: {
            speedKmh,
            speedLimitKmh: 80,
            headingDeg: bearing,
            ignition: true,
            fuelLevelPercent: 100,
            batteryVoltage: Number((battery / 20).toFixed(1)),
            odometerKm: 0,
            satellites: 12,
            gsmSignalPercent: 95,
            immobilizerCutoffActive: false,
            tamperDetected: false,
            lastPingTime: 'Just now'
          },
          deviceInfo: {
            imei: deviceId,
            deviceModel: 'Traccar Client (Smartphone)',
            brand: 'Mobile Device',
            protocol: 'OsmAnd / HTTP',
            port: 443,
            firmwareVersion: 'Traccar-Client-v6',
            carrier: 'Cellular'
          },
          historyTrail: [{ lat, lng: lon }],
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (firestoreErr) {
      console.warn('Failed to update vehicle in Firestore:', firestoreErr);
    }
  }

  // 2. Optionally store raw telemetry log into MongoDB
  try {
    await saveTelemetryToMongo(telemetry);
  } catch (mongoErr) {
    console.warn('MongoDB telemetry persistence skipped:', mongoErr);
  }

  // Return standard HTTP 200 OK expected by Traccar Client
  res.status(200).json(telemetry);
}
