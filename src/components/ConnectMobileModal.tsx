import React, { useState, useEffect } from 'react';
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
  Globe
} from 'lucide-react';
import { Vehicle } from '../types/fleet.ts';

interface ConnectMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateMobileVehicle: (mobileVehicle: Vehicle) => void;
}

export const ConnectMobileModal: React.FC<ConnectMobileModalProps> = ({
  isOpen,
  onClose,
  onUpdateMobileVehicle
}) => {
  const [activeTab, setActiveTab] = useState<'browser' | 'traccar' | 'pwa'>('browser');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedApiUrl, setCopiedApiUrl] = useState(false);

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

  const vercelAppUrl = 'https://gwtrax.vercel.app/';
  const vercelApiEndpoint = 'https://gwtrax.vercel.app/api/gps';

  // Geolocation watcher
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
          const accuracy = Math.round(position.coords.accuracy || 10);

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
            id: 'MOB-USER',
            plateNumber: 'MOB-LIVE',
            name: 'My Mobile Phone (Courier GPS)',
            type: 'delivery_van',
            driverId: 'drv-mobile',
            driverName: 'Mobile User (Current Phone)',
            status: speedKmh > 3 ? 'moving' : 'idle',
            location: {
              latitude: lat,
              longitude: lng,
              address: `GPS Fix (±${accuracy}m): ${lat}, ${lng}`,
              city: 'Live Location',
              country: 'Current Area'
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
              imei: 'MOBILE-PHONE-LIVE',
              deviceModel: 'Mobile Phone Geolocation (HTML5)',
              brand: 'Smartphone Client',
              protocol: 'Browser W3C Geolocation API',
              port: 443,
              firmwareVersion: 'GWTrax-Mobile-Web-v3.2',
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
          maximumAge: 1000
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTransmitting]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(vercelAppUrl);
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
              <span>Mobile Phone Connection Guide</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Connect Your Mobile to GWTrax
            </h2>
            <p className="text-xs text-slate-400">
              Host URL: <span className="text-emerald-400 font-mono">{vercelAppUrl}</span>
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
            onClick={() => setActiveTab('browser')}
            className={`py-2 px-2.5 rounded-lg text-center transition-colors ${
              activeTab === 'browser'
                ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. In-Browser Live GPS
          </button>
          <button
            onClick={() => setActiveTab('traccar')}
            className={`py-2 px-2.5 rounded-lg text-center transition-colors ${
              activeTab === 'traccar'
                ? 'bg-slate-800 text-sky-400 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Traccar Mobile App
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`py-2 px-2.5 rounded-lg text-center transition-colors ${
              activeTab === 'pwa'
                ? 'bg-slate-800 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Install PWA App
          </button>
        </div>

        {/* TAB 1: IN-BROWSER DIRECT GPS TRACKING */}
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
                When you open <strong className="text-emerald-400">{vercelAppUrl}</strong> on your phone&apos;s browser (Safari or Chrome), click the button below to start sending your phone&apos;s real GPS location to GWTrax.
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

            {/* Open on Mobile via Link or QR */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 font-mono uppercase text-[10px]">Open on your Smartphone</span>
                <div className="text-xs font-bold text-white">Direct URL to Open on Phone Browser:</div>
                <div className="text-emerald-400 font-mono text-xs">{vercelAppUrl}</div>
              </div>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs border border-slate-700 whitespace-nowrap"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: TRACCAR CLIENT NATIVE APP (BACKGROUND GPS) */}
        {activeTab === 'traccar' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  Background Mobile GPS Tracking (Traccar Client)
                </span>
                <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">
                  Background Tracking
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                If you want your phone to continue tracking even when the screen is locked or in your pocket, use the free, open-source <strong>Traccar Client</strong> app available on iOS and Android:
              </p>

              {/* Step by step */}
              <div className="space-y-2.5 font-sans">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-mono font-bold text-sky-400 text-xs">Step 1:</span>
                  <div>
                    <span className="text-white font-medium">Download &quot;Traccar Client&quot;</span>
                    <p className="text-[11px] text-slate-400">Available free on the Apple App Store (iOS) or Google Play Store (Android).</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-mono font-bold text-sky-400 text-xs">Step 2:</span>
                  <div className="space-y-1 w-full">
                    <span className="text-white font-medium">Set Server URL:</span>
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[11px] text-emerald-400">
                      <span className="truncate">{vercelApiEndpoint}</span>
                      <button
                        onClick={handleCopyApiUrl}
                        className="text-slate-400 hover:text-white shrink-0 ml-2"
                        title="Copy API Endpoint"
                      >
                        {copiedApiUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-mono font-bold text-sky-400 text-xs">Step 3:</span>
                  <div>
                    <span className="text-white font-medium">Note Your Device Identifier</span>
                    <p className="text-[11px] text-slate-400">The app generates a 6-digit Device ID (or enter your phone number). In GWTrax, link that ID as your IMEI.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-mono font-bold text-sky-400 text-xs">Step 4:</span>
                  <div>
                    <span className="text-white font-medium">Toggle &quot;Service Status&quot; to ON</span>
                    <p className="text-[11px] text-slate-400">The app will begin transmitting battery %, speed, and location automatically in the background!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INSTALL AS HOME SCREEN APP (PWA) */}
        {activeTab === 'pwa' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="font-bold text-white text-sm block">
                Install GWTrax as a Native Mobile App
              </span>
              <p className="text-slate-300 leading-relaxed">
                You can install <strong className="text-white">GWTrax</strong> directly onto your mobile home screen to enjoy a full-screen, app-like experience with zero browser address bars:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* iPhone Safari */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 block font-mono">Apple iPhone (iOS Safari)</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    <li>Open <strong>{vercelAppUrl}</strong> in Safari</li>
                    <li>Tap the <strong>Share</strong> button (square with arrow) at the bottom</li>
                    <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                    <li>Tap <strong>Add</strong> in the top right</li>
                  </ol>
                </div>

                {/* Android Chrome */}
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                  <span className="font-bold text-sky-400 block font-mono">Android (Google Chrome)</span>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                    <li>Open <strong>{vercelAppUrl}</strong> in Chrome</li>
                    <li>Tap the <strong>3 vertical dots</strong> (Menu) at top right</li>
                    <li>Tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong></li>
                    <li>Follow the prompt to install</li>
                  </ol>
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
