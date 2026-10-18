import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Radio, 
  Compass, 
  Zap, 
  ShieldCheck, 
  Gauge, 
  MapPin, 
  Activity, 
  BatteryCharging, 
  Battery, 
  Wifi, 
  Sparkles, 
  AlertTriangle, 
  ArrowLeft, 
  Navigation, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { Vehicle } from '../types/fleet.ts';

interface MobileTrackerViewProps {
  onBackToFleet: () => void;
  onSaveVehicle: (vehicle: Vehicle) => Promise<void>;
  initialDeviceId?: string;
}

export const MobileTrackerView: React.FC<MobileTrackerViewProps> = ({
  onBackToFleet,
  onSaveVehicle,
  initialDeviceId
}) => {
  // Device & Driver info
  const [deviceId, setDeviceId] = useState(initialDeviceId || '0582649777');
  const [driverName, setDriverName] = useState('Mobile Driver');
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Live GPS tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const [pingCount, setPingCount] = useState(0);
  const [lastPingTime, setLastPingTime] = useState<string>('Never');
  const [geoError, setGeoError] = useState<string | null>(null);

  // Live telemetry metrics
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    accuracy: number;
    altitude: number;
  }>({
    lat: 25.1619,
    lng: 55.4206,
    speed: 0,
    heading: 90,
    accuracy: 5,
    altitude: 12
  });

  // Phone Battery & WakeLock
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  // AI Telematics & Behavioral Analysis
  const [aiScore, setAiScore] = useState<number>(98);
  const [harshBraking, setHarshBraking] = useState<number>(0);
  const [harshAccel, setHarshAccel] = useState<number>(0);
  const [aiAdvice, setAiAdvice] = useState<string>('GPS Telematics Active. Smooth Acceleration & Eco Cruise.');

  const previousSpeedRef = useRef<number>(0);
  const historyTrailRef = useRef<[number, number][]>([]);

  // Battery Status API
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      }).catch(() => {});
    }
  }, []);

  // Request WakeLock so screen never sleeps during tracking
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = lock;
        setWakeLockActive(true);
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  };

  // Helper to commit telemetry update to Firestore
  const transmitPositionToFirestore = async (
    lat: number,
    lng: number,
    speed: number,
    heading: number,
    accuracy: number
  ) => {
    // AI Driving Behavior analysis
    const speedDelta = speed - previousSpeedRef.current;
    if (speedDelta > 14) {
      setHarshAccel(p => p + 1);
      setAiScore(s => Math.max(60, s - 3));
      setAiAdvice('AI Alert: Harsh Acceleration Detected. Feather the throttle.');
    } else if (speedDelta < -16) {
      setHarshBraking(p => p + 1);
      setAiScore(s => Math.max(50, s - 4));
      setAiAdvice('AI Alert: Heavy Braking Detected. Increase headway distance.');
    } else if (speed > 80) {
      setAiAdvice('AI Notice: Over 80 km/h speed threshold. Maintain safe following gap.');
    } else if (speed > 10) {
      setAiAdvice('AI Status: Optimal eco-speed and green trajectory maintained.');
    }
    previousSpeedRef.current = speed;

    // Append to trail
    historyTrailRef.current.push([lat, lng]);
    if (historyTrailRef.current.length > 50) {
      historyTrailRef.current = historyTrailRef.current.slice(-50);
    }

    const payload: Vehicle = {
      id: `MOB-${deviceId}`,
      plateNumber: `MOB-${deviceId.slice(-4)}`,
      name: `Smartphone Beacon (${deviceId})`,
      type: 'delivery_van',
      driverId: `DRV-${deviceId.slice(-4)}`,
      driverName: driverName,
      status: speed > 3 ? 'moving' : 'idle',
      location: {
        latitude: lat,
        longitude: lng,
        address: `Live GPS Fix: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${accuracy}m)`,
        city: 'Dubai / UAE Area',
        country: 'United Arab Emirates'
      },
      telemetry: {
        speedKmh: speed,
        speedLimitKmh: 80,
        headingDeg: heading,
        ignition: true,
        fuelLevelPercent: batteryLevel,
        batteryVoltage: isCharging ? 4.8 : 3.85,
        engineRpm: speed > 0 ? 1800 : 700,
        coolantTempC: 36,
        fuelCapacityLiters: 100,
        odometerKm: Math.round(pingCount * 0.05),
        satellites: accuracy < 10 ? 16 : 10,
        gsmSignalPercent: 98,
        immobilizerCutoffActive: false,
        tamperDetected: false,
        lastPingTime: 'Just now'
      },
      deviceInfo: {
        imei: deviceId,
        deviceModel: 'Smartphone AI GPS Beacon (W3C High-Precision)',
        brand: 'Smart Device',
        protocol: 'Web Geolocation + WakeLock API',
        port: 443,
        firmwareVersion: 'GWTrax-AI-Terminal-v3.5',
        simImsi: '424021000000000',
        carrier: '5G / 4G Cellular',
        compliance: 'W3C Sensor & Real-Time Telematics Ready'
      },
      historyTrail: historyTrailRef.current
    };

    try {
      await onSaveVehicle(payload);
      setPingCount(p => p + 1);
      setLastPingTime(new Date().toLocaleTimeString());
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    } catch (err) {
      console.warn('Firestore beacon sync error:', err);
    }
  };

  // Watch position with W3C High-Accuracy GPS
  useEffect(() => {
    let watchId: number | null = null;

    if (isTracking && !isSimulatingDrive && 'geolocation' in navigator) {
      setGeoError(null);
      requestWakeLock();

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;
          const heading = Math.round(pos.coords.heading || 90);
          const accuracy = Math.round(pos.coords.accuracy || 5);
          const altitude = Math.round(pos.coords.altitude || 10);

          setCoords({
            lat,
            lng,
            speed: speedKmh,
            heading,
            accuracy,
            altitude
          });

          transmitPositionToFirestore(lat, lng, speedKmh, heading, accuracy);
        },
        (err) => {
          setGeoError(
            err.code === 1
              ? 'GPS Permission Denied. Please enable location permission in browser settings.'
              : `GPS Fix Error: ${err.message}`
          );
          setIsTracking(false);
          releaseWakeLock();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      releaseWakeLock();
    };
  }, [isTracking, isSimulatingDrive, deviceId, driverName, batteryLevel, isCharging]);

  // One-Click Simulated Drive along Dubai Sheikh Zayed Road (for indoor/couch testing)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isSimulatingDrive) {
      requestWakeLock();
      let step = 0;
      // Coordinates simulating drive on Dubai E11 highway
      const routePoints: [number, number, number, number][] = [
        [25.1619, 55.4206, 35, 95],
        [25.1635, 55.4230, 48, 98],
        [25.1660, 55.4265, 62, 102],
        [25.1690, 55.4310, 75, 105],
        [25.1725, 55.4360, 82, 108],
        [25.1750, 55.4410, 78, 110],
        [25.1780, 55.4470, 70, 112],
        [25.1810, 55.4520, 58, 115],
        [25.1830, 55.4570, 42, 118],
        [25.1850, 55.4620, 25, 120]
      ];

      timer = setInterval(() => {
        const pt = routePoints[step % routePoints.length];
        step++;

        setCoords({
          lat: pt[0],
          lng: pt[1],
          speed: pt[2],
          heading: pt[3],
          accuracy: 3,
          altitude: 15
        });

        transmitPositionToFirestore(pt[0], pt[1], pt[2], pt[3], 3);
      }, 2500);
    }

    return () => {
      if (timer) clearInterval(timer);
      releaseWakeLock();
    };
  }, [isSimulatingDrive, deviceId, driverName, batteryLevel, isCharging]);

  return (
    <div className="min-h-[calc(100vh-65px)] w-full bg-slate-950 text-white p-4 sm:p-6 flex flex-col items-center">
      <div className="max-w-xl w-full space-y-5">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <button
            onClick={onBackToFleet}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Fleet Map</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono">
            {wakeLockActive && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Zap className="w-3 h-3" />
                <span>Screen Awake</span>
              </span>
            )}
            <div className="flex items-center gap-1 text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> : <Battery className="w-3.5 h-3.5 text-sky-400" />}
              <span>{batteryLevel}%</span>
            </div>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <Radio className={`w-3.5 h-3.5 ${isTracking || isSimulatingDrive ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
            <span>AI Mobile GPS Terminal · W3C High Precision</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Smart Mobile Beacon
          </h1>
          <p className="text-xs text-slate-400">
            Stream live smartphone telemetry directly to your GWTrax Google Maps fleet dashboard with zero 3rd-party apps.
          </p>
        </div>

        {/* Error Banner */}
        {geoError && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{geoError}</span>
          </div>
        )}

        {/* Main Transmission Controller Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
          {/* Identity & Pairing Info */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Assigned Beacon IMEI / ID</span>
              <div className="font-mono text-sm font-bold text-emerald-400 flex items-center gap-2">
                <span>{deviceId}</span>
                <span className="text-[10px] text-slate-400 font-sans font-normal">({driverName})</span>
              </div>
            </div>

            <button
              onClick={() => setIsConfiguring(!isConfiguring)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800 border border-slate-700"
            >
              {isConfiguring ? 'Done' : 'Edit ID'}
            </button>
          </div>

          {/* Quick ID Config Drawer */}
          {isConfiguring && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3 animate-fade-in text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Device Identifier / Phone Number:</label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Driver Name:</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Circular HUD Speedometer & Heading */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className={`relative w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
              isTracking || isSimulatingDrive
                ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.25)] bg-slate-950'
                : 'border-slate-800 bg-slate-950'
            }`}>
              {/* Outer compass degree indicator */}
              <div 
                className="absolute inset-2 rounded-full border border-dashed border-slate-800 pointer-events-none transition-transform duration-700"
                style={{ transform: `rotate(${coords.heading}deg)` }}
              >
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full mx-auto -mt-1.5 shadow-sm" />
              </div>

              {/* Speed readout */}
              <span className="text-4xl font-black font-mono tracking-tight text-white">
                {coords.speed}
              </span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                KM / H
              </span>

              {/* Status pill inside circle */}
              <span className={`mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono ${
                isTracking || isSimulatingDrive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {isTracking || isSimulatingDrive ? 'BROADCASTING' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Real-time Diagnostics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Accuracy</span>
              <span className="font-mono font-bold text-emerald-400">±{coords.accuracy} m</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Heading</span>
              <span className="font-mono font-bold text-sky-400">{coords.heading}°</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Transmitted</span>
              <span className="font-mono font-bold text-purple-400">#{pingCount} pings</span>
            </div>
          </div>

          {/* AI Driving Behavior & Telematics Safety Engine */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Driver Telematics Score</span>
              </div>
              <div className="font-mono font-bold text-emerald-400 text-sm">
                {aiScore} / 100
              </div>
            </div>

            {/* Score progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${aiScore}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-300 pt-0.5 leading-relaxed">
              {aiAdvice}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[10px] text-slate-400 font-mono">
              <div>Harsh Acceleration: <strong className="text-white">{harshAccel}</strong></div>
              <div>Harsh Deceleration: <strong className="text-white">{harshBraking}</strong></div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2.5">
            {/* Primary Toggle: Real Smartphone GPS */}
            <button
              onClick={() => {
                if (isSimulatingDrive) setIsSimulatingDrive(false);
                setIsTracking(!isTracking);
              }}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                isTracking
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-900/40'
              }`}
            >
              {isTracking ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>STOP LIVE PHONE GPS BROADCAST</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>START REAL PHONE GPS BROADCAST</span>
                </>
              )}
            </button>

            {/* Simulated Highway Drive Test (for indoor/couch verification) */}
            <button
              onClick={() => {
                if (isTracking) setIsTracking(false);
                setIsSimulatingDrive(!isSimulatingDrive);
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                isSimulatingDrive
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-300'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSimulatingDrive ? 'animate-spin' : ''}`} />
              <span>
                {isSimulatingDrive ? 'Stop Highway Drive Simulation' : 'Test Drive Simulation (Dubai E11 Highway)'}
              </span>
            </button>
          </div>

          {/* Live Geolocation Coordinates Readout */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Last Broadcast Time:</span>
              <span className="text-emerald-400 font-bold">{lastPingTime}</span>
            </div>
            <div className="text-slate-300 text-[11px] truncate">
              Latitude: <strong className="text-white">{coords.lat}</strong> · Longitude: <strong className="text-white">{coords.lng}</strong>
            </div>
          </div>
        </div>

        {/* Action: Jump to Google Maps */}
        <button
          onClick={onBackToFleet}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>Open Live Tracking in Google Maps Layout</span>
        </button>
      </div>
    </div>
  );
};
