import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import { 
  Truck, 
  Gauge, 
  Fuel, 
  Thermometer, 
  Activity, 
  Radio, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Maximize2, 
  Compass, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  Search, 
  Filter, 
  RotateCw, 
  Volume2, 
  Wifi, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Smartphone,
  Navigation,
  Satellite,
  Crosshair,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Vehicle, GeofenceZone } from '../types/fleet.ts';

interface FleetMapProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  geofences: GeofenceZone[];
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string | null) => void;
  onOpenRouteOptimizer: () => void;
}

// Error Boundary specifically for Google Maps Platform SDK
interface ErrorBoundaryProps {
  fallback: (error: Error | null) => React.ReactNode;
  children: React.ReactNode;
}

class GoogleMapErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Google Maps Platform runtime error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

// Sub-component: Camera Auto-Follow & Centering Controller
const MapCameraController: React.FC<{
  selectedVehicle: Vehicle | null;
  autoCenterEnabled: boolean;
}> = ({ selectedVehicle, autoCenterEnabled }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedVehicle && autoCenterEnabled) {
      map.panTo({
        lat: selectedVehicle.location.latitude,
        lng: selectedVehicle.location.longitude
      });
      const currentZoom = map.getZoom() || 12;
      if (currentZoom < 14) {
        map.setZoom(15);
      }
    }
  }, [map, selectedVehicle?.location.latitude, selectedVehicle?.location.longitude, autoCenterEnabled]);

  return null;
};

// Sub-component: Real-Time Google Maps Traffic Layer
const TrafficLayerComponent: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const layerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    if (enabled) {
      if (!layerRef.current) {
        layerRef.current = new google.maps.TrafficLayer();
      }
      layerRef.current.setMap(map);
    } else {
      if (layerRef.current) {
        layerRef.current.setMap(null);
      }
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.setMap(null);
      }
    };
  }, [map, mapsLib, enabled]);

  return null;
};

// Sub-component: Vehicle Breadcrumb Trajectory Path Polyline
const VehicleTrailPolyline: React.FC<{
  vehicle: Vehicle | null;
  enabled: boolean;
}> = ({ vehicle, enabled }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!enabled || !vehicle || !vehicle.historyTrail || vehicle.historyTrail.length < 2) {
      return;
    }

    const path: google.maps.LatLngLiteral[] = vehicle.historyTrail.map((pt: any) => {
      if (Array.isArray(pt)) {
        return { lat: pt[0], lng: pt[1] };
      }
      return { lat: pt.lat, lng: pt.lng };
    });

    path.push({
      lat: vehicle.location.latitude,
      lng: vehicle.location.longitude
    });

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: vehicle.status === 'moving' ? '#10b981' : '#38bdf8',
      strokeOpacity: 0.85,
      strokeWeight: 4,
      map
    });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, mapsLib, vehicle?.id, vehicle?.historyTrail, vehicle?.location.latitude, vehicle?.location.longitude, enabled]);

  return null;
};

// Sub-component: Geofence Zones Overlay (Circles & Polygons)
const GeofenceOverlays: React.FC<{
  geofences: GeofenceZone[];
  enabled: boolean;
}> = ({ geofences, enabled }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const shapesRef = useRef<(google.maps.Circle | google.maps.Polygon)[]>([]);

  useEffect(() => {
    shapesRef.current.forEach(s => s.setMap(null));
    shapesRef.current = [];

    if (!map || !mapsLib || !enabled || geofences.length === 0) return;

    geofences.forEach(zone => {
      const isRestricted = zone.category === 'restricted';
      const color = isRestricted ? '#ef4444' : '#0ea5e9';

      if (zone.type === 'circle' && zone.center && zone.radiusMeters) {
        const centerLat = Array.isArray(zone.center) ? zone.center[0] : (zone.center as any).latitude;
        const centerLng = Array.isArray(zone.center) ? zone.center[1] : (zone.center as any).longitude;
        const circle = new google.maps.Circle({
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.12,
          map,
          center: { lat: centerLat, lng: centerLng },
          radius: zone.radiusMeters
        });
        shapesRef.current.push(circle);
      } else if (zone.coordinates && zone.coordinates.length >= 3) {
        const paths = zone.coordinates.map((c: any) => ({
          lat: Array.isArray(c) ? c[0] : c.latitude,
          lng: Array.isArray(c) ? c[1] : c.longitude
        }));
        const polygon = new google.maps.Polygon({
          paths,
          strokeColor: color,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: color,
          fillOpacity: 0.12,
          map
        });
        shapesRef.current.push(polygon);
      }
    });

    return () => {
      shapesRef.current.forEach(s => s.setMap(null));
      shapesRef.current = [];
    };
  }, [map, mapsLib, geofences, enabled]);

  return null;
};

// Guarded Markers Container: only mounts AdvancedMarkers once the map instance is ready
const FleetAdvancedMarkers: React.FC<{
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (id: string) => void;
}> = ({ vehicles, selectedVehicleId, onSelectVehicle }) => {
  const map = useMap();
  if (!map) return null;

  return (
    <>
      {vehicles.map((vehicle) => {
        const isSelected = selectedVehicleId === vehicle.id;
        const isMoving = vehicle.status === 'moving';
        const isIdle = vehicle.status === 'idle';
        const isPhone = vehicle.deviceInfo?.protocol?.includes('OsmAnd') || vehicle.id.startsWith('MOB-');

        return (
          <AdvancedMarker
            key={vehicle.id}
            position={{
              lat: vehicle.location.latitude,
              lng: vehicle.location.longitude
            }}
            onClick={() => onSelectVehicle(vehicle.id)}
            title={`${vehicle.plateNumber} (${vehicle.name})`}
          >
            {/* Custom High-Definition Pin Design */}
            <div className="relative group cursor-pointer flex flex-col items-center">
              {/* Live Speed / Plate Badge */}
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-lg flex items-center gap-1 border transition-all ${
                isSelected
                  ? 'bg-slate-900 text-emerald-300 border-emerald-400 scale-110'
                  : isMoving
                  ? 'bg-slate-950/90 text-emerald-400 border-emerald-500/50'
                  : isIdle
                  ? 'bg-slate-950/90 text-amber-400 border-amber-500/50'
                  : 'bg-slate-950/90 text-slate-400 border-slate-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span>{vehicle.plateNumber}</span>
                {isMoving && <span>· {vehicle.telemetry.speedKmh}k</span>}
              </div>

              {/* Icon Bubble */}
              <div className={`mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-xl transition-transform ${
                isSelected
                  ? 'bg-emerald-500 border-white text-slate-950 scale-110 ring-4 ring-emerald-500/30'
                  : isMoving
                  ? 'bg-slate-900 border-emerald-400 text-emerald-400'
                  : isIdle
                  ? 'bg-slate-900 border-amber-400 text-amber-400'
                  : 'bg-slate-900 border-slate-600 text-slate-400'
              }`}>
                {isPhone ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
              </div>

              {/* Ripple ring for active moving vehicles */}
              {isMoving && (
                <span className="absolute bottom-1 w-10 h-10 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
              )}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};

export const FleetMap: React.FC<FleetMapProps> = ({
  vehicles,
  setVehicles,
  geofences,
  selectedVehicleId,
  setSelectedVehicleId,
  onOpenRouteOptimizer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'moving' | 'idle' | 'stopped' | 'alert'>('all');
  const [showGeofences, setShowGeofences] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [mapTheme, setMapTheme] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  
  const [authError, setAuthError] = useState<string | null>(null);
  const [immobilizerConfirmModal, setImmobilizerConfirmModal] = useState<Vehicle | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  // Google Maps API Key resolved from secret store or environment
  const googleMapsApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyDqKdnwICmr09ptifBARxhNVZjaIoavLkc';

  // Listen for Google Maps Authentication / ApiNotActivated failure
  useEffect(() => {
    const handleAuthFailure = () => {
      setAuthError('Maps JavaScript API is not yet activated on this Google Cloud project.');
    };
    (window as any).gm_authFailure = handleAuthFailure;
    return () => {
      delete (window as any).gm_authFailure;
    };
  }, []);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery = 
        v.name.toLowerCase().includes(q) ||
        v.plateNumber.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.location.city.toLowerCase().includes(q) ||
        (v.deviceInfo?.imei && v.deviceInfo.imei.toLowerCase().includes(q));
      
      if (statusFilter === 'all') return matchesQuery;
      return matchesQuery && v.status === statusFilter;
    });
  }, [vehicles, searchQuery, statusFilter]);

  // Compute center from vehicles or fallback to Dubai UAE
  const defaultCenter = useMemo(() => {
    if (selectedVehicle) {
      return {
        lat: selectedVehicle.location.latitude,
        lng: selectedVehicle.location.longitude
      };
    }
    if (vehicles.length > 0) {
      const avgLat = vehicles.reduce((sum, v) => sum + v.location.latitude, 0) / vehicles.length;
      const avgLng = vehicles.reduce((sum, v) => sum + v.location.longitude, 0) / vehicles.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 25.1619, lng: 55.4206 }; // Default Dubai / UAE
  }, [vehicles, selectedVehicle]);

  // Command handlers
  const handleToggleImmobilizer = (vehicle: Vehicle) => {
    const newCutoff = !vehicle.telemetry.immobilizerCutoffActive;
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicle.id) {
        return {
          ...v,
          status: newCutoff ? 'stopped' : 'idle',
          telemetry: {
            ...v.telemetry,
            immobilizerCutoffActive: newCutoff,
            speedKmh: newCutoff ? 0 : v.telemetry.speedKmh,
            ignition: !newCutoff,
            lastPingTime: 'Just now'
          }
        };
      }
      return v;
    }));
    setImmobilizerConfirmModal(null);
    setCommandFeedback(newCutoff ? `Engine CUT-OFF activated for ${vehicle.plateNumber}.` : `Engine power RESTORED for ${vehicle.plateNumber}.`);
    setTimeout(() => setCommandFeedback(null), 4000);
  };

  const handleSendPing = (vehicleId: string) => {
    setCommandFeedback(`Direct OTA ping dispatched to device ${vehicleId}. Telemetry ACK received.`);
    setTimeout(() => setCommandFeedback(null), 3000);
  };

  const handlePulseAlarm = (vehicleId: string) => {
    setCommandFeedback(`Audible buzzer & hazard pulse activated on ${vehicleId}.`);
    setTimeout(() => setCommandFeedback(null), 3000);
  };

  // High-Precision Vector Canvas Fallback (Used when Google Maps API key is pending activation)
  const renderCanvasFallback = () => {
    return (
      <div className="relative w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        {/* Activation Banner */}
        <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl text-left space-y-3 z-10">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Google Maps Platform Activation Required</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Your Google Maps API key (<code className="text-emerald-400 font-mono">AIzaSyDq...</code>) is saved, but the <strong>&quot;Maps JavaScript API&quot;</strong> is not enabled in your Google Cloud project.
          </p>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
            <div className="text-white font-medium">To enable it in 15 seconds:</div>
            <ol className="list-decimal list-inside text-slate-400 space-y-1">
              <li>Click the Google Cloud Console button below</li>
              <li>Click the blue <strong>&quot;Enable&quot;</strong> button</li>
              <li>Return here and refresh</li>
            </ol>
          </div>

          <div className="pt-1 flex items-center justify-between gap-3">
            <a
              href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors text-xs"
            >
              <span>Enable Maps JavaScript API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Tracking Position Summary */}
        {selectedVehicle && (
          <div className="mt-4 max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>● Live Tracker: {selectedVehicle.plateNumber}</span>
              <span>{selectedVehicle.telemetry.speedKmh} km/h</span>
            </div>
            <div className="text-white font-mono text-[11px]">
              GPS: {selectedVehicle.location.latitude.toFixed(6)}, {selectedVehicle.location.longitude.toFixed(6)}
            </div>
            <div className="text-slate-400 text-[11px] truncate">
              {selectedVehicle.location.address}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] w-full overflow-hidden bg-slate-950">
      {/* 1. LEFT SIDEBAR: FLEET REGISTRY & TELEMETRY LIST */}
      <div className="w-full lg:w-80 xl:w-96 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 z-10 shadow-lg">
        {/* Search & Filter Header */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Fleet Telematics</h2>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{filteredVehicles.length} units online</span>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plate, IMEI, driver, city..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] font-medium text-slate-400">
            {(['all', 'moving', 'idle', 'stopped', 'alert'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-2 py-0.5 rounded capitalize transition-colors whitespace-nowrap ${
                  statusFilter === filter
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'hover:text-slate-200 bg-slate-900/60'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Telematics List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
          {filteredVehicles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <Truck className="w-8 h-8 text-slate-700 mx-auto" />
              <p>No vehicles match your active search filter.</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => {
              const isSelected = selectedVehicleId === vehicle.id;
              const isMoving = vehicle.status === 'moving';
              const isIdle = vehicle.status === 'idle';
              const isReefer = vehicle.type === 'reefer_truck';
              const isPhone = vehicle.deviceInfo?.protocol?.includes('OsmAnd') || vehicle.id.startsWith('MOB-');

              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/60 shadow-md'
                      : 'bg-slate-950/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isMoving ? 'bg-emerald-500/15 text-emerald-400' :
                        isIdle ? 'bg-amber-500/15 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {isPhone ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Truck className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white font-mono">{vehicle.plateNumber}</span>
                          {vehicle.telemetry.immobilizerCutoffActive && (
                            <span className="px-1 py-0.2 text-[9px] font-mono bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                              LOCKED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{vehicle.name}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-white">
                        {vehicle.telemetry.speedKmh} <span className="text-[10px] text-slate-400 font-normal">km/h</span>
                      </div>
                      <span className={`inline-block text-[10px] font-semibold uppercase ${
                        isMoving ? 'text-emerald-400' :
                        isIdle ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        ● {vehicle.status}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry details summary */}
                  <div className="mt-2 pt-2 border-t border-slate-900 grid grid-cols-3 gap-1 font-mono text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-sky-400" />
                      <span>{vehicle.telemetry.fuelLevelPercent}%</span>
                    </div>
                    {isReefer && (
                      <div className="flex items-center gap-1 text-teal-400 font-bold">
                        <Thermometer className="w-3 h-3" />
                        <span>{vehicle.telemetry.cargoTempC}°C</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{vehicle.telemetry.batteryVoltage}V</span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2 truncate">
                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{vehicle.location.address}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER: GOOGLE MAPS LAYOUT */}
      <div className="flex-1 relative h-full w-full overflow-hidden">
        {/* Floating Controls Ribbon on top of Google Maps */}
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Map Layer Mode Switcher */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl text-xs font-medium">
            <button
              onClick={() => setMapTheme('roadmap')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                mapTheme === 'roadmap' ? 'bg-slate-800 text-sky-400 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Roads</span>
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                mapTheme === 'satellite' ? 'bg-slate-800 text-amber-400 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
            <button
              onClick={() => setMapTheme('hybrid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                mapTheme === 'hybrid' ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hybrid</span>
            </button>
          </div>

          {/* Quick Toggle Overlays (Traffic, Geofences, Trails, Auto-Follow) */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl text-xs">
            <button
              onClick={() => setShowTraffic(!showTraffic)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                showTraffic ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Live Google Traffic Overlay"
            >
              Traffic
            </button>
            <button
              onClick={() => setShowGeofences(!showGeofences)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                showGeofences ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Geofence Boundaries"
            >
              Geofences
            </button>
            <button
              onClick={() => setShowTrails(!showTrails)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                showTrails ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle GPS Breadcrumb Trails"
            >
              Trails
            </button>
            <button
              onClick={() => setAutoFollow(!autoFollow)}
              className={`px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                autoFollow ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Auto-Follow Active Tracker"
            >
              <Crosshair className={`w-3.5 h-3.5 ${autoFollow ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Follow</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {commandFeedback && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{commandFeedback}</span>
          </div>
        )}

        {/* Official Google Maps Platform Container Wrapped with Safe Boundary */}
        <div className="w-full h-full">
          <GoogleMapErrorBoundary fallback={() => renderCanvasFallback()}>
            <APIProvider apiKey={googleMapsApiKey}>
              <Map
                id="gwtrax-google-map"
                defaultCenter={defaultCenter}
                defaultZoom={13}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                mapTypeId={mapTheme}
                gestureHandling="greedy"
                disableDefaultUI={false}
                zoomControl={true}
                fullscreenControl={false}
                streetViewControl={false}
                className="w-full h-full"
              >
                {/* Traffic Layer */}
                <TrafficLayerComponent enabled={showTraffic} />

                {/* Camera Auto-centering on Selected Unit */}
                <MapCameraController
                  selectedVehicle={selectedVehicle}
                  autoCenterEnabled={autoFollow}
                />

                {/* Geofences Vector Overlays */}
                <GeofenceOverlays geofences={geofences} enabled={showGeofences} />

                {/* Active Vehicle Trajectory Trail */}
                <VehicleTrailPolyline vehicle={selectedVehicle} enabled={showTrails} />

                {/* Advanced Markers for all Active Fleet Vehicles (Guarded against early mount) */}
                <FleetAdvancedMarkers
                  vehicles={filteredVehicles}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={setSelectedVehicleId}
                />

                {/* InfoWindow for Selected Vehicle */}
                {selectedVehicle && (
                  <InfoWindow
                    position={{
                      lat: selectedVehicle.location.latitude,
                      lng: selectedVehicle.location.longitude
                    }}
                    onCloseClick={() => setSelectedVehicleId(null)}
                    headerContent={
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>{selectedVehicle.plateNumber}</span>
                        <span className="text-[10px] font-normal text-slate-500">({selectedVehicle.name})</span>
                      </div>
                    }
                  >
                    <div className="text-xs text-slate-800 space-y-1.5 min-w-[210px] py-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span>Speed: <strong>{selectedVehicle.telemetry.speedKmh} km/h</strong></span>
                        <span className="capitalize font-semibold text-emerald-600">● {selectedVehicle.status}</span>
                      </div>
                      <div className="text-[10px] text-slate-600 truncate">
                        {selectedVehicle.location.address}
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-1 border-t border-slate-200 text-[10px] text-slate-700">
                        <div>Driver: <strong>{selectedVehicle.driverName}</strong></div>
                        <div>Battery: <strong>{selectedVehicle.telemetry.batteryVoltage}V</strong></div>
                        <div>Fuel: <strong>{selectedVehicle.telemetry.fuelLevelPercent}%</strong></div>
                        <div>Sats: <strong>{selectedVehicle.telemetry.satellites} GPS</strong></div>
                      </div>
                      <div className="pt-2 flex items-center gap-1.5">
                        <button
                          onClick={() => handleSendPing(selectedVehicle.id)}
                          className="flex-1 py-1 px-2 text-[10px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                        >
                          Ping Device
                        </button>
                        <button
                          onClick={() => setImmobilizerConfirmModal(selectedVehicle)}
                          className="py-1 px-2 text-[10px] font-semibold bg-rose-600 text-white rounded hover:bg-rose-500"
                        >
                          {selectedVehicle.telemetry.immobilizerCutoffActive ? 'Restore' : 'Cut-Off'}
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </GoogleMapErrorBoundary>
        </div>

        {/* Quick Link to Route Optimizer */}
        <button
          onClick={onOpenRouteOptimizer}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-2xl text-xs transition-transform hover:scale-105"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Multi-Stop Dispatch Optimizer</span>
        </button>
      </div>

      {/* 3. RIGHT SIDEBAR: SELECTED VEHICLE TELEMETRICS & CONTROL CONSOLE */}
      {selectedVehicle && (
        <div className="w-full lg:w-80 xl:w-96 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 z-10 overflow-y-auto p-4 space-y-4 shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-bold text-white">{selectedVehicle.plateNumber}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  selectedVehicle.status === 'moving' ? 'bg-emerald-500/20 text-emerald-300' :
                  selectedVehicle.status === 'idle' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {selectedVehicle.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedVehicle.name}</p>
            </div>
            <button
              onClick={() => setSelectedVehicleId(null)}
              className="text-slate-500 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Primary Gauges */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span>Speed</span>
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {selectedVehicle.telemetry.speedKmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Limit: {selectedVehicle.telemetry.speedLimitKmh} km/h</div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span>Fuel / Battery</span>
                <Fuel className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {selectedVehicle.telemetry.fuelLevelPercent}%
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Voltage: {selectedVehicle.telemetry.batteryVoltage}V</div>
            </div>
          </div>

          {/* Live Address & Satellites */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 text-xs">
            <div className="text-slate-400 text-[11px] font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Current Geolocation</span>
            </div>
            <div className="text-white font-medium">{selectedVehicle.location.address}</div>
            <div className="font-mono text-[11px] text-slate-400">
              {selectedVehicle.location.latitude.toFixed(6)}, {selectedVehicle.location.longitude.toFixed(6)}
            </div>
          </div>

          {/* Driver & Telematics Hardware */}
          <div className="space-y-2 text-xs">
            <h4 className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Telemetry Diagnostics</h4>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Driver:</span>
                <span className="text-white font-medium">{selectedVehicle.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tracker Hardware:</span>
                <span className="text-white font-medium truncate max-w-[160px]">{selectedVehicle.deviceInfo?.deviceModel || 'GPS Tracker'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Device IMEI / ID:</span>
                <span className="text-emerald-400 font-mono font-bold">{selectedVehicle.deviceInfo?.imei}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Satellites Fixed:</span>
                <span className="text-white font-mono">{selectedVehicle.telemetry.satellites} GPS / GLONASS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GSM Signal:</span>
                <span className="text-white font-mono">{selectedVehicle.telemetry.gsmSignalPercent}% (4G LTE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Fix Time:</span>
                <span className="text-white font-mono">{selectedVehicle.telemetry.lastPingTime}</span>
              </div>
            </div>
          </div>

          {/* Remote Security Controls */}
          <div className="space-y-2 text-xs pt-1">
            <h4 className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Remote Telematics Commands</h4>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSendPing(selectedVehicle.id)}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                <span>Request Ping</span>
              </button>

              <button
                onClick={() => handlePulseAlarm(selectedVehicle.id)}
                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Pulse Alarm</span>
              </button>
            </div>

            {/* Remote Engine Immobilizer Cut-off button */}
            <button
              onClick={() => setImmobilizerConfirmModal(selectedVehicle)}
              className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                selectedVehicle.telemetry.immobilizerCutoffActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {selectedVehicle.telemetry.immobilizerCutoffActive ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Restore Engine Power (Relay Unlock)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Remote Engine Immobilizer Cut-off</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Immobilizer Confirmation Modal */}
      {immobilizerConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">
                {immobilizerConfirmModal.telemetry.immobilizerCutoffActive ? 'Restore Engine Power' : 'Emergency Engine Cut-off'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {immobilizerConfirmModal.telemetry.immobilizerCutoffActive
                ? `Confirm unlocking the ignition relay on vehicle ${immobilizerConfirmModal.plateNumber}? Power will be restored immediately.`
                : `Are you sure you want to trigger the remote ignition relay CUT-OFF on vehicle ${immobilizerConfirmModal.plateNumber}? The engine will be immobilized and the vehicle stopped.`}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setImmobilizerConfirmModal(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleImmobilizer(immobilizerConfirmModal)}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white ${
                  immobilizerConfirmModal.telemetry.immobilizerCutoffActive
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {immobilizerConfirmModal.telemetry.immobilizerCutoffActive ? 'Confirm Restore' : 'Confirm Cut-off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
