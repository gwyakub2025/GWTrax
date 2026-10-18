# GWTrax — Enterprise Fleet Telematics & Route Optimization
> **Track Smart. Move Better**

GWTrax is an enterprise-grade commercial vehicle telematics, route optimization, driver safety scoring, and real-time cold-chain IoT tracking platform.

---

## 🗄️ Firestore Collections Required

GWTrax requires the following Firestore collections:

| Collection Name | Document ID Pattern | Purpose & Telematics Fields |
|---|---|---|
| **`vehicles`** | `VEH-XXXXXX` / License Plate | Active fleet vehicle records, live GPS latitude/longitude, speed, heading, fuel level %, cargo temperature (°C for Reefer cold-chain), ignition state, odometer, immobilizer cut-off state, tracker IMEI, port, carrier, and breadcrumb trail. |
| **`drivers`** | `drv-XX` / `DRV-XXXXXX` | Driver profiles, assigned vehicle, license info, contact phone, safety scorecards, harsh braking count, rapid acceleration, excessive idling, and speeding events. |
| **`geofences`** | `geo-XX` / `GEO-XXXXXX` | Virtual geographic boundaries (ports, logistics hubs, customer sites, industrial zones), boundary polygon coordinates or circle radius, speed limits, and active vehicles currently inside. |
| **`alerts`** | `alert-XX` / `ALERT-XXXXXX` | Real-time incident logs: over-speeding, geofence breaches, cold chain temperature spikes, SOS tamper alerts, low battery, and unacknowledged incident tracking. |
| **`routes`** | `route-XX` / `ROUTE-XXXXXX` | Dispatched optimized multi-stop delivery routes, ordered waypoints, total km, distance/fuel saved, CO2 reduction, and transit status. |
| **`test`** | `connection` | Connection handshake document used on startup to verify live database reachability. |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
# Frontend Cloud Firestore Variables (Vite client)
VITE_FIREBASE_API_KEY="AIzaSyB7yrhgFwgetTJlfam7c9LTns6zO7jqUs4"
VITE_FIREBASE_AUTH_DOMAIN="gwtrack-1232e.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="gwtrack-1232e"
VITE_FIREBASE_STORAGE_BUCKET="gwtrack-1232e.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="348489971672"
VITE_FIREBASE_APP_ID="1:348489971672:web:3deb9241cad09c203564ad"
VITE_FIREBASE_FIRESTORE_DATABASE_ID="(default)"

# Serverless GPS Ingestion & MongoDB Variables (Optional)
MONGODB_URI="mongodb+srv://admin:password@cluster0.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="gwtrax_telematics"
MONGO_COLLECTION_TELEMETRY="telemetry_logs"
MONGO_COLLECTION_VEHICLES="vehicles"
```

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 Live Mobile & Hardware GPS Tracking Setup

1. **Traccar Client / OsmAnd (Android & iOS)**:
   - Download **Traccar Client** from Google Play Store or Apple App Store.
   - Set **Server URL** to: `https://gwtrax.vercel.app/api/gps` (or your domain).
   - Set **Device Identifier**: e.g., `VEH-704` or your IMEI.
   - Frequency: `5 seconds`. Turn the tracking switch **ON**.
2. **Hardware GPS Trackers (Teltonika, Coban, Sinotrack, Queclink)**:
   - Point your tracker IP/DNS to your gateway port (e.g. 5027 for Teltonika FMC130 Codec 8E).
