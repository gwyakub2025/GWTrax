import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  Check, 
  Radio, 
  QrCode, 
  Compass, 
  Zap, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  BatteryCharging,
  Globe,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Vehicle } from '../types/fleet.ts';

interface ConnectMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMobileVehicle: (mobileVehicle: Vehicle) => void;
  onOpenMobileTerminal?: () => void;
}

export const ConnectMobileModal: React.FC<ConnectMobileModalProps> = ({
  isOpen,
  onClose,
  onUpdateMobileVehicle,
  onOpenMobileTerminal
}) => {
  const [activeTab, setActiveTab] = useState<'qr_scan' | 'browser' | 'traccar'>('qr_scan');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedApiUrl, setCopiedApiUrl] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Device identifier (defaults to user's registered ID)
  const deviceId = '0582649777';

  // Live Geolocation Tracking state
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    accuracy: number;
  } | null>(null);
  const [pingCount, setPingCount] = useState(0);

  // Dynamic host URL (works on Vercel and local dev)
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://gwtrax.vercel.app';
  const mobileTrackerUrl = `${appOrigin}/?mode=tracker&id=${deviceId}`;
  const vercelApiEndpoint = `${appOrigin}/api/gps`;

  // Generate QR Code dynamically
  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(mobileTrackerUrl, {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#022c22',
          light: '#34d399'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [isOpen, mobileTrackerUrl]);

  // Geolocation watcher for In-Browser tab
  useEffect(() => {
    let watchId: number | null = null;

    if (isTransmitting && 'geolocation' in navigator) {
      setGeoError(null);
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));
          const speedKmh = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;
          const heading = position.coords.heading || 90;
          const accuracy = Math.round(position.coords.accuracy || 5);

          setCurrentCoords({
            lat,
            lng,
            speed: speedKmh,
            heading,
            accuracy
          });
          setPingCount((p) => p + 1);

          // Update/Register into live fleet
          const mobileVehicle: Vehicle = {
            id: `MOB-${deviceId}`,
            plateNumber: `MOB-${deviceId.slice(-4)}`,
            name: `Smartphone Beacon (${deviceId})`,
            type: 'delivery_van',
            driverId: `drv-${deviceId.slice(-4)}`,
            driverName: 'Mobile Courier',
            status: speedKmh > 3 ? 'moving' : 'idle',
            location: {
              latitude: lat,
              longitude: lng,
              address: `Live GPS Fix: ${lat.toFixed(5)}, ${lng.toFixed(5)} (±${accuracy}m)`,
              city: 'Dubai / UAE Area',
              country: 'United Arab Emirates'
            },
            telemetry: {
              speedKmh,
              speedLimitKmh: 80,
              headingDeg: heading,
              ignition: true,
              fuelLevelPercent: 100,
              fuelCapacityLiters: 100,
              engineRpm: speedKmh > 0 ? 1600 : 700,
              coolantTempC: 38,
              batteryVoltage: 3.85,
              odometerKm: 24,
              satellites: 18,
              gsmSignalPercent: 98,
              immobilizerCutoffActive: false,
              tamperDetected: false,
              lastPingTime: 'Just now'
            },
            deviceInfo: {
              imei: deviceId,
              deviceModel: 'Smartphone AI GPS Beacon (W3C High-Precision)',
              brand: 'Smart Device',
              protocol: 'Web Geolocation API',
              port: 443,
              firmwareVersion: 'GWTrax-AI-Terminal-v3.5',
              simImsi: '424099882211',
              carrier: 'Cellular / WiFi',
              compliance: 'High-Precision W3C Geolocation'
            },
            historyTrail: [[lat, lng]]
          };

          onUpdateMobileVehicle(mobileVehicle);
        },
        (error) => {
          setGeoError(
            error.code === 1
              ? 'Location permission denied. Please allow location access in your browser settings.'
              : `Unable to acquire GPS fix: ${error.message}`
          );
          setIsTransmitting(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTransmitting, deviceId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileTrackerUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyApiUrl = () => {
    navigator.clipboard.writeText(vercelApiEndpoint);
    setCopiedApiUrl(true);
    setTimeout(() => setCopiedApiUrl(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl overflow-y-auto max-h-[90vh] space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase">
              <Smartphone className="w-4 h-4" />
              <span>Smart Mobile Beacon Setup</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Connect Your Mobile Phone to GWTrax
            </h2>
            <p className="text-xs text-slate-400">
              Zero App Installs Required · W3C High-Precision AI Telematics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('qr_scan')}
            className={`py-2 px-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'qr_scan'
                ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>1. Scan QR with Phone</span>
          </button>
          <button
            onClick={() => setActiveTab('browser')}
            className={`py-2 px-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'browser'
                ? 'bg-slate-800 text-sky-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Track On This Device</span>
          </button>
          <button
            onClick={() => setActiveTab('traccar')}
            className={`py-2 px-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'traccar'
                ? 'bg-slate-800 text-amber-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3. Background App (Traccar)</span>
          </button>
        </div>

        {/* TAB 1: INSTANT QR CODE SCAN */}
        {activeTab === 'qr_scan' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-4">
              <div className="space-y-1">
                <span className="text-emerald-400 font-bold text-sm block">
                  Scan QR with your Phone Camera
                </span>
                <p className="text-slate-300 max-w-sm text-xs leading-relaxed">
                  Open your iPhone or Android camera, point it at this QR code, and tap the link to start live broadcasting.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-emerald-400 rounded-2xl shadow-2xl flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan to Track Phone"
                    className="w-48 h-48 rounded-xl"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center font-mono text-slate-900 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="space-y-2 w-full pt-1">
                <div className="text-[11px] text-slate-400 font-mono">
                  Assigned Device Identifier: <strong className="text-white">{deviceId}</strong>
                </div>

                <div className="flex items-center gap-2 max-w-md mx-auto">
                  <input
                    type="text"
                    readOnly
                    value={mobileTrackerUrl}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono text-[11px] truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 border border-slate-700"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Direct Launch Button */}
              {onOpenMobileTerminal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMobileTerminal();
                  }}
                  className="w-full max-w-md py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Or Launch Fullscreen Mobile Tracker on This Device</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: IN-BROWSER LIVE GPS TRACKING */}
        {activeTab === 'browser' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  Stream Live GPS Coordinates from this Phone
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  Zero App Download
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Click the button below to start sending your phone&apos;s real GPS location to GWTrax Firestore database.
              </p>

              {/* Transmission Controls */}
              <button
                onClick={() => setIsTransmitting(!isTransmitting)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  isTransmitting
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {isTransmitting ? (
                  <>
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Stop Mobile GPS Stream</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Start Transmitting Live GPS From This Phone</span>
                  </>
                )}
              </button>

              {geoError && (
                <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-3 rounded-lg text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{geoError}</span>
                </div>
              )}

              {/* Live coordinates readout */}
              {currentCoords && (
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Transmitting Active (Ping #{pingCount})</span>
                    </span>
                    <span>Accuracy: ±{currentCoords.accuracy}m</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-200 pt-1">
                    <div>Latitude: <strong className="text-white">{currentCoords.lat}</strong></div>
                    <div>Longitude: <strong className="text-white">{currentCoords.lng}</strong></div>
                    <div>Speed: <strong className="text-white">{currentCoords.speed} km/h</strong></div>
                    <div>Heading: <strong className="text-white">{currentCoords.heading}°</strong></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TRACCAR CLIENT BACKGROUND */}
        {activeTab === 'traccar' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  Traccar Client Mobile App (Background Tracking)
                </span>
                <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">
                  Background Service
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                If you prefer using the native Traccar Client app with your phone in your pocket:
              </p>

              {/* Step by step */}
              <div className="space-y-2.5 font-sans">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-mono font-bold text-sky-400 text-xs">1:</span>
                  <div className="w-full">
                    <span className="text-white font-medium">Server URL:</span>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 mt-1">
                      <span className="truncate">{vercelApiEndpoint}</span>
                      <button
                        onClick={handleCopyApiUrl}
                        className="text-slate-400 hover:text-white shrink-0 ml-2"
                      >
                        {copiedApiUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-mono font-bold text-sky-400 text-xs">2:</span>
                  <div>
                    <span className="text-white font-medium">Device Identifier:</span>
                    <p className="text-[11px] text-emerald-400 font-mono mt-0.5 font-bold">{deviceId}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-mono font-bold text-sky-400 text-xs">3:</span>
                  <div>
                    <span className="text-white font-medium">Set Distance to 0 (Disabled):</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">Allows the phone to transmit every 5 seconds even when stationary indoors.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-mono font-bold text-sky-400 text-xs">4:</span>
                  <div>
                    <span className="text-white font-medium">Continuous Tracking Switch:</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">Flip &quot;Continuous tracking&quot; switch to ON.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            GWTrax Mobile Gateway · HTTPS Enabled
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
