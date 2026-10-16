import React, { useState, useEffect, useRef } from 'react';
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
  Info
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

export const FleetMap: React.FC<FleetMapProps> = ({
  vehicles,
  setVehicles,
  geofences,
  selectedVehicleId,
  setSelectedVehicleId,
  onOpenRouteOptimizer
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'moving' | 'idle' | 'stopped' | 'alert'>('all');
  const [showGeofences, setShowGeofences] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [mapZoom, setMapZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [immobilizerConfirmModal, setImmobilizerConfirmModal] = useState<Vehicle | null>(null);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesQuery = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesQuery;
    return matchesQuery && v.status === statusFilter;
  });

  // Calculate center of filtered vehicles
  const bounds = React.useMemo(() => {
    if (vehicles.length === 0) return { minLat: 23, maxLat: 27, minLng: 46, maxLng: 59 };
    const lats = vehicles.map(v => v.location.latitude);
    const lngs = vehicles.map(v => v.location.longitude);
    return {
      minLat: Math.min(...lats) - 0.2,
      maxLat: Math.max(...lats) + 0.2,
      minLng: Math.min(...lngs) - 0.3,
      maxLng: Math.max(...lngs) + 0.3
    };
  }, [vehicles]);

  // Transform Geo Coordinates to Canvas Pixels
  const geoToPixel = (lat: number, lng: number, width: number, height: number) => {
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lngSpan = bounds.maxLng - bounds.minLng || 1;

    // Normalizing
    const normX = (lng - bounds.minLng) / lngSpan;
    const normY = (bounds.maxLat - lat) / latSpan; // inverted Y

    const basePadding = 60;
    const drawWidth = width - basePadding * 2;
    const drawHeight = height - basePadding * 2;

    const centerX = width / 2;
    const centerY = height / 2;

    const rawX = basePadding + normX * drawWidth;
    const rawY = basePadding + normY * drawHeight;

    // Apply zoom & pan
    const zoomedX = centerX + (rawX - centerX) * mapZoom + panOffset.x;
    const zoomedY = centerY + (rawY - centerY) * mapZoom + panOffset.y;

    return { x: zoomedX, y: zoomedY };
  };

  // Center on vehicle
  const centerOnVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const latSpan = bounds.maxLat - bounds.minLat || 1;
    const lngSpan = bounds.maxLng - bounds.minLng || 1;
    const normX = (vehicle.location.longitude - bounds.minLng) / lngSpan;
    const normY = (bounds.maxLat - vehicle.location.latitude) / latSpan;
    const drawWidth = canvas.width - 120;
    const drawHeight = canvas.height - 120;
    const targetX = 60 + normX * drawWidth;
    const targetY = 60 + normY * drawHeight;
    setPanOffset({
      x: (canvas.width / 2 - targetX) * mapZoom,
      y: (canvas.height / 2 - targetY) * mapZoom
    });
  };

  // Canvas Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI resolution
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // 1. Dark high-tech background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle geographical grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridSize = 60 * mapZoom;
    const offsetX = panOffset.x % gridSize;
    const offsetY = panOffset.y % gridSize;

    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Render Simulated Regional Highway Networks
    // Sheikh Zayed E11, E311, Riyadh Arterials, Muscat Highway
    const highways = [
      // Dubai corridor (JAFZA -> Downtown -> Sharjah)
      [
        { lat: 24.980, lng: 55.050 },
        { lat: 25.045, lng: 55.122 },
        { lat: 25.123, lng: 55.204 },
        { lat: 25.197, lng: 55.274 },
        { lat: 25.320, lng: 55.380 }
      ],
      // Riyadh Olaya corridor
      [
        { lat: 24.620, lng: 46.660 },
        { lat: 24.713, lng: 46.675 },
        { lat: 24.810, lng: 46.690 }
      ],
      // Muscat Coastal Highway
      [
        { lat: 23.550, lng: 58.450 },
        { lat: 23.614, lng: 58.545 },
        { lat: 23.680, lng: 58.620 }
      ]
    ];

    highways.forEach((hw) => {
      ctx.strokeStyle = '#1e2e4a';
      ctx.lineWidth = 4 * mapZoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      hw.forEach((pt, idx) => {
        const p = geoToPixel(pt.lat, pt.lng, width, height);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Highway inner glow line
      ctx.strokeStyle = '#2563eb33';
      ctx.lineWidth = 1.5 * mapZoom;
      ctx.stroke();
    });

    // 4. Render Geofences
    if (showGeofences) {
      geofences.forEach((geo) => {
        if (geo.type === 'polygon' && geo.coordinates) {
          ctx.beginPath();
          geo.coordinates.forEach((coord, idx) => {
            const p = geoToPixel(coord[0], coord[1], width, height);
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.closePath();
          ctx.fillStyle = geo.color + '18';
          ctx.fill();
          ctx.strokeStyle = geo.color + '88';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Geofence label
          const firstPt = geoToPixel(geo.coordinates[0][0], geo.coordinates[0][1], width, height);
          ctx.fillStyle = geo.color;
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.fillText(`ZONE: ${geo.name.substring(0, 24)}...`, firstPt.x + 4, firstPt.y - 4);
        } else if (geo.type === 'circle' && geo.center) {
          const centerPt = geoToPixel(geo.center[0], geo.center[1], width, height);
          const radiusPixels = (geo.radiusMeters || 2000) * 0.015 * mapZoom;
          ctx.beginPath();
          ctx.arc(centerPt.x, centerPt.y, radiusPixels, 0, Math.PI * 2);
          ctx.fillStyle = geo.color + '18';
          ctx.fill();
          ctx.strokeStyle = geo.color + '88';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // 5. Render History Breadcrumb Trails
    if (showTrails) {
      vehicles.forEach((v) => {
        if (v.historyTrail && v.historyTrail.length > 1) {
          ctx.strokeStyle = v.id === selectedVehicleId ? '#10b981' : '#38bdf844';
          ctx.lineWidth = v.id === selectedVehicleId ? 2.5 : 1.5;
          ctx.beginPath();
          v.historyTrail.forEach((pt: any, idx) => {
            const ptLat = Array.isArray(pt) ? pt[0] : pt?.lat;
            const ptLng = Array.isArray(pt) ? pt[1] : pt?.lng;
            if (ptLat !== undefined && ptLng !== undefined) {
              const p = geoToPixel(ptLat, ptLng, width, height);
              if (idx === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            }
          });
          ctx.stroke();
        }
      });
    }

    // 6. Render Vehicles
    vehicles.forEach((v) => {
      const p = geoToPixel(v.location.latitude, v.location.longitude, width, height);
      const isSelected = v.id === selectedVehicleId;

      // Status color
      let statusColor = '#10b981'; // moving
      if (v.status === 'idle') statusColor = '#f59e0b';
      if (v.status === 'stopped') statusColor = '#94a3b8';
      if (v.status === 'alert') statusColor = '#ef4444';
      if (v.telemetry.immobilizerCutoffActive) statusColor = '#dc2626';

      // Pulse ring for moving or selected
      if (isSelected || v.status === 'moving') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, (isSelected ? 22 : 14) + Math.sin(Date.now() / 300) * 2, 0, Math.PI * 2);
        ctx.fillStyle = statusColor + '20';
        ctx.fill();
        ctx.strokeStyle = statusColor + '60';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Vehicle marker circle
      ctx.save();
      ctx.translate(p.x, p.y);

      // Bearing pointer
      ctx.rotate((v.telemetry.headingDeg * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(5, -6);
      ctx.lineTo(-5, -6);
      ctx.closePath();
      ctx.fillStyle = statusColor;
      ctx.fill();
      ctx.restore();

      // Main pin bubble
      ctx.beginPath();
      ctx.arc(p.x, p.y, isSelected ? 12 : 9, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, isSelected ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = statusColor;
      ctx.fill();

      // Plate & Speed Label
      ctx.fillStyle = '#ffffff';
      ctx.font = isSelected ? 'bold 11px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      
      // Label pill background
      const labelText = `${v.plateNumber} · ${v.telemetry.speedKmh} km/h`;
      const textMetrics = ctx.measureText(labelText);
      const pillWidth = textMetrics.width + 10;
      
      ctx.fillStyle = '#0b0f19ee';
      ctx.fillRect(p.x - pillWidth / 2, p.y + 14, pillWidth, 18);
      ctx.strokeStyle = isSelected ? statusColor : '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - pillWidth / 2, p.y + 14, pillWidth, 18);

      ctx.fillStyle = isSelected ? '#34d399' : '#e2e8f0';
      ctx.fillText(labelText, p.x, p.y + 27);
    });

  }, [vehicles, selectedVehicleId, showGeofences, showTrails, mapZoom, panOffset]);

  // Canvas Mouse Interactivity
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check hit test against vehicles
    let clickedVehicle: Vehicle | null = null;
    vehicles.forEach((v) => {
      const p = geoToPixel(v.location.latitude, v.location.longitude, rect.width, rect.height);
      const dist = Math.hypot(p.x - clickX, p.y - clickY);
      if (dist < 20) {
        clickedVehicle = v;
      }
    });

    if (clickedVehicle) {
      setSelectedVehicleId((clickedVehicle as Vehicle).id);
    }
  };

  // Remote Commands
  const handleTriggerImmobilizer = (vehicle: Vehicle) => {
    const isCurrentlyCut = vehicle.telemetry.immobilizerCutoffActive;
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicle.id) {
          return {
            ...v,
            status: isCurrentlyCut ? 'moving' : 'stopped',
            telemetry: {
              ...v.telemetry,
              immobilizerCutoffActive: !isCurrentlyCut,
              speedKmh: isCurrentlyCut ? 45 : 0,
              ignition: !isCurrentlyCut ? false : true,
              lastPingTime: 'Just now'
            }
          };
        }
        return v;
      })
    );
    setImmobilizerConfirmModal(null);
    setCommandFeedback(
      isCurrentlyCut
        ? `Immobilizer relay released for ${vehicle.plateNumber}. Fuel pump circuit restored.`
        : `CRITICAL: Remote engine cutoff relay ENGAGED for ${vehicle.plateNumber}. Fuel pump isolated.`
    );
    setTimeout(() => setCommandFeedback(null), 5000);
  };

  const handlePingImmediate = (vehicle: Vehicle) => {
    setCommandFeedback(`Immediate telemetry ping request sent to ${vehicle.deviceInfo.deviceModel} (IMEI: ${vehicle.deviceInfo.imei}). Response acknowledged in 82ms.`);
    setTimeout(() => setCommandFeedback(null), 4000);
  };

  const handleSoundHorn = (vehicle: Vehicle) => {
    setCommandFeedback(`Remote alarm horn & hazard lights pulsed 3x on ${vehicle.plateNumber}.`);
    setTimeout(() => setCommandFeedback(null), 4000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden bg-slate-950">
      {/* Left Sidebar: Fleet List & Telemetry Summary */}
      <div className="w-full lg:w-96 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0 z-10">
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Fleet Telemetry</span>
              <span className="text-xs text-slate-400 font-normal">({filteredVehicles.length} units)</span>
            </h2>
            <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Gateway Active
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter plate, vehicle, city, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Segmented status filter buttons */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-medium">
            {(['all', 'moving', 'idle', 'stopped'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 py-1 rounded capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredVehicles.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              <Truck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-slate-300">No Trackers Found</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Register a hardware tracker or connect a mobile phone beacon to track live GPS.
              </p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicleId;
            return (
              <div
                key={vehicle.id}
                onClick={() => centerOnVehicle(vehicle)}
                className={`p-3.5 cursor-pointer transition-all hover:bg-slate-800/50 ${
                  isSelected ? 'bg-slate-800/90 border-l-2 border-emerald-400' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white tracking-wide">
                        {vehicle.plateNumber}
                      </span>
                      <span className="text-xs text-slate-400 truncate max-w-[140px]">
                        {vehicle.name.split('(')[0]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[210px]">{vehicle.location.address}</span>
                    </div>
                  </div>

                  {/* Status & Speed */}
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-slate-100">
                      {vehicle.telemetry.speedKmh}{' '}
                      <span className="text-[10px] font-normal text-slate-400">km/h</span>
                    </div>
                    <div className="text-[10px] font-medium capitalize mt-0.5 flex items-center justify-end gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          vehicle.status === 'moving'
                            ? 'bg-emerald-400'
                            : vehicle.status === 'idle'
                            ? 'bg-amber-400'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span className="text-slate-300">{vehicle.status}</span>
                    </div>
                  </div>
                </div>

                {/* Sub telemetry metrics (Fuel, Temp, Driver) */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/40 grid grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-emerald-400/80" />
                    <span>{vehicle.telemetry.fuelLevelPercent}%</span>
                  </div>
                  {vehicle.telemetry.cargoTempC !== undefined ? (
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-sky-400" />
                      <span className={vehicle.telemetry.cargoTempC > -18 ? 'text-amber-400 font-bold' : 'text-sky-300'}>
                        {vehicle.telemetry.cargoTempC}°C
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-indigo-400" />
                      <span>{vehicle.telemetry.engineRpm} RPM</span>
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1 truncate text-slate-300">
                    <span className="truncate">{vehicle.driverName.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Center: Interactive Map Canvas */}
      <div className="flex-1 relative flex flex-col min-w-0">
        {/* Floating Map Controls & Overlays */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg backdrop-blur text-xs">
            <button
              onClick={() => setShowGeofences(!showGeofences)}
              className={`px-2.5 py-1 rounded transition-colors ${
                showGeofences ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Geofences
            </button>
            <button
              onClick={() => setShowTrails(!showTrails)}
              className={`px-2.5 py-1 rounded transition-colors ${
                showTrails ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Trails
            </button>
            <button
              onClick={() => {
                setMapZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="px-2 py-1 text-slate-400 hover:text-white rounded"
              title="Reset View"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setMapZoom((z) => Math.min(z + 0.3, 3))}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white font-mono font-bold hover:bg-slate-800 rounded"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setMapZoom((z) => Math.max(z - 0.3, 0.6))}
              className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white font-mono font-bold hover:bg-slate-800 rounded"
              title="Zoom Out"
            >
              -
            </button>
          </div>
        </div>

        {/* Command Toast */}
        {commandFeedback && (
          <div className="absolute top-4 right-4 z-30 max-w-md bg-slate-900 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-lg text-xs shadow-lg backdrop-blur flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{commandFeedback}</span>
          </div>
        )}

        {/* Map Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Map Legend / Footer stats strip */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-3">
          <div className="pointer-events-auto bg-slate-950/85 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 font-mono flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Moving ({vehicles.filter(v => v.status === 'moving').length})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Idle ({vehicles.filter(v => v.status === 'idle').length})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Stopped ({vehicles.filter(v => v.status === 'stopped').length})</span>
            </span>
            <span className="hidden sm:inline text-slate-500">| Middle East &amp; Global Gateway 5027/5023</span>
          </div>

          <button
            onClick={onOpenRouteOptimizer}
            className="pointer-events-auto flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-3.5 py-2 rounded-lg shadow-lg transition-transform active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Multi-Stop Dispatch Optimizer</span>
          </button>
        </div>
      </div>

      {/* Right Drawer: Active Selected Vehicle Telemetry */}
      {selectedVehicle && (
        <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-start justify-between">
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase font-semibold">
                {selectedVehicle.deviceInfo.compliance}
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {selectedVehicle.plateNumber}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedVehicle.name}
              </p>
            </div>
            <button
              onClick={() => setSelectedVehicleId(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          {/* Critical Immobilizer Status Banner */}
          {selectedVehicle.telemetry.immobilizerCutoffActive && (
            <div className="bg-rose-500/20 border-b border-rose-500/40 p-3 flex items-center gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">ENGINE IMMOBILIZER ENGAGED</span>
                <p className="text-[11px] text-rose-300/80">Vehicle starter relay cut. Ignition disabled remotely.</p>
              </div>
            </div>
          )}

          {/* Real-Time Live Telemetry Gauges */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Speed Gauge */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Speed</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">Max {selectedVehicle.telemetry.speedLimitKmh}</span>
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-white">
                  {selectedVehicle.telemetry.speedKmh}{' '}
                  <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      selectedVehicle.telemetry.speedKmh > selectedVehicle.telemetry.speedLimitKmh
                        ? 'bg-rose-500'
                        : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        (selectedVehicle.telemetry.speedKmh / selectedVehicle.telemetry.speedLimitKmh) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Fuel Level */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fuel Tank</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {Math.round((selectedVehicle.telemetry.fuelLevelPercent / 100) * selectedVehicle.telemetry.fuelCapacityLiters)} L
                  </span>
                </div>
                <div className="mt-2 font-mono text-2xl font-bold text-white">
                  {selectedVehicle.telemetry.fuelLevelPercent}%
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${selectedVehicle.telemetry.fuelLevelPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Reefer Cold-Chain Temp or Engine RPM */}
            {selectedVehicle.telemetry.cargoTempC !== undefined && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                    <span className="font-medium text-slate-200">Reefer Cold-Chain Cargo Temp</span>
                  </span>
                  <span className="font-mono text-[10px] text-sky-400">Target &lt; -18.0°C</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className={`font-mono text-2xl font-bold ${selectedVehicle.telemetry.cargoTempC > -18 ? 'text-amber-400' : 'text-sky-300'}`}>
                    {selectedVehicle.telemetry.cargoTempC}°C
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Pharma Grade BLE Sensor (ESCORT)
                  </span>
                </div>
              </div>
            )}

            {/* Secondary Telemetry Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Engine RPM</div>
                <div className="text-slate-100 font-bold mt-1">{selectedVehicle.telemetry.engineRpm}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Coolant Temp</div>
                <div className="text-slate-100 font-bold mt-1">{selectedVehicle.telemetry.coolantTempC}°C</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Battery Volt</div>
                <div className="text-slate-100 font-bold mt-1">{selectedVehicle.telemetry.batteryVoltage} V</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Odometer</div>
                <div className="text-slate-100 font-bold mt-1">{selectedVehicle.telemetry.odometerKm.toLocaleString()} km</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Satellites</div>
                <div className="text-slate-100 font-bold mt-1">{selectedVehicle.telemetry.satellites} GPS/GLONASS</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">GSM Signal</div>
                <div className="text-slate-100 font-bold mt-1">{selectedVehicle.telemetry.gsmSignalPercent}% 4G</div>
              </div>
            </div>

            {/* Assigned Driver Box */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Assigned Driver</div>
                <div className="text-sm font-semibold text-white mt-0.5">{selectedVehicle.driverName}</div>
                <div className="text-xs text-slate-400">{selectedVehicle.location.city}, {selectedVehicle.location.country}</div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                Ignition: {selectedVehicle.telemetry.ignition ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Current Route Dispatch Info */}
            {selectedVehicle.currentRoute && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Destination</span>
                  <span className="text-emerald-400 font-mono font-semibold">ETA {selectedVehicle.currentRoute.eta}</span>
                </div>
                <div className="text-xs font-medium text-slate-200">
                  {selectedVehicle.currentRoute.destinationName}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {selectedVehicle.currentRoute.distanceRemainingKm} km remaining
                </div>
              </div>
            )}

            {/* Hardware Device & Protocol Specs */}
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  <span>GPS Device Specs</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{selectedVehicle.deviceInfo.carrier}</span>
              </div>
              <div className="text-xs font-mono text-slate-300 space-y-1">
                <div>Model: <span className="text-white">{selectedVehicle.deviceInfo.deviceModel}</span></div>
                <div>Protocol: <span className="text-emerald-400">{selectedVehicle.deviceInfo.protocol}</span></div>
                <div>IMEI: <span className="text-slate-400">{selectedVehicle.deviceInfo.imei}</span></div>
                <div>Firmware: <span className="text-slate-400">{selectedVehicle.deviceInfo.firmwareVersion}</span></div>
              </div>
            </div>

            {/* Remote Commands Action Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Remote Telematics Commands</div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePingImmediate(selectedVehicle)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Request Ping</span>
                </button>

                <button
                  onClick={() => handleSoundHorn(selectedVehicle)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Pulse Alarm</span>
                </button>
              </div>

              {/* Remote Engine Immobilization Cut-Off */}
              <button
                onClick={() => setImmobilizerConfirmModal(selectedVehicle)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-sm ${
                  selectedVehicle.telemetry.immobilizerCutoffActive
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {selectedVehicle.telemetry.immobilizerCutoffActive ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>RESTORE ENGINE / RELEASE IMMOBILIZER</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>ENGAGE REMOTE ENGINE CUT-OFF (RELAY)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Immobilizer Safety Confirmation Modal */}
      {immobilizerConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">
                {immobilizerConfirmModal.telemetry.immobilizerCutoffActive
                  ? 'Restore Vehicle Ignition?'
                  : 'Confirm Remote Engine Immobilization'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {immobilizerConfirmModal.telemetry.immobilizerCutoffActive
                ? `This will transmit an unlatch relay pulse to the onboard ${immobilizerConfirmModal.deviceInfo.deviceModel} GPS tracker, allowing driver ${immobilizerConfirmModal.driverName} to restart the vehicle.`
                : `WARNING: You are about to send a hardware relay cutoff pulse to vehicle ${immobilizerConfirmModal.plateNumber} (current speed: ${immobilizerConfirmModal.telemetry.speedKmh} km/h). Telematics safety protocol will cut the fuel pump circuit once speed drops below 20 km/h.`}
            </p>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setImmobilizerConfirmModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTriggerImmobilizer(immobilizerConfirmModal)}
                className={`px-4 py-2 text-xs font-bold rounded-lg ${
                  immobilizerConfirmModal.telemetry.immobilizerCutoffActive
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {immobilizerConfirmModal.telemetry.immobilizerCutoffActive ? 'Release Cutoff' : 'Authorize Cutoff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
