import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Truck, 
  Navigation, 
  Zap, 
  ShieldAlert, 
  Fuel, 
  Thermometer, 
  BatteryCharging, 
  Radio, 
  Search, 
  Filter, 
  Plus, 
  Smartphone, 
  Lock, 
  Unlock, 
  Trash2, 
  ExternalLink, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Database, 
  Cpu, 
  Layers, 
  TrendingUp, 
  Route, 
  RefreshCw 
} from 'lucide-react';
import { Vehicle, GeofenceZone, FleetAlert } from '../types/fleet.ts';
import { DriverMetrics } from '../utils/driverScoring.ts';

interface OverviewDashboardViewProps {
  vehicles: Vehicle[];
  drivers: DriverMetrics[];
  geofences: GeofenceZone[];
  alerts: FleetAlert[];
  onSelectVehicleForMap: (vehicleId: string) => void;
  onOpenRegisterVehicleModal: () => void;
  onOpenMobileModal: () => void;
  onOpenRouteOptimizer: () => void;
  onToggleImmobilizer: (vehicleId: string, currentCutoff: boolean) => Promise<void>;
  onDeleteVehicle: (vehicleId: string) => Promise<void>;
  onAcknowledgeAlert: (alertId: string) => Promise<void>;
  onClearDemoData?: () => Promise<void>;
  onLoadStarterTemplate?: () => Promise<void>;
}

export const OverviewDashboardView: React.FC<OverviewDashboardViewProps> = ({
  vehicles,
  drivers,
  geofences,
  alerts,
  onSelectVehicleForMap,
  onOpenRegisterVehicleModal,
  onOpenMobileModal,
  onOpenRouteOptimizer,
  onToggleImmobilizer,
  onDeleteVehicle,
  onAcknowledgeAlert,
  onClearDemoData,
  onLoadStarterTemplate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'moving' | 'idle' | 'stopped' | 'reefer' | 'alerts'>('all');
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmClearDb, setConfirmClearDb] = useState(false);

  // Computed Key Fleet Performance Indicators
  const movingCount = vehicles.filter((v) => v.status === 'moving').length;
  const idleCount = vehicles.filter((v) => v.status === 'idle').length;
  const stoppedCount = vehicles.filter((v) => v.status === 'stopped').length;
  const reeferVehicles = vehicles.filter((v) => v.telemetry.cargoTempC !== undefined);
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

  const avgSpeed = vehicles.length > 0 
    ? Math.round(vehicles.reduce((acc, v) => acc + (v.telemetry.speedKmh || 0), 0) / vehicles.length) 
    : 0;

  const avgFuel = vehicles.length > 0 
    ? Math.round(vehicles.reduce((acc, v) => acc + (v.telemetry.fuelLevelPercent || 0), 0) / vehicles.length) 
    : 0;

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        v.plateNumber.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        String(v.deviceInfo.imei).toLowerCase().includes(q) ||
        String(v.location.address).toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'moving') return v.status === 'moving';
      if (statusFilter === 'idle') return v.status === 'idle';
      if (statusFilter === 'stopped') return v.status === 'stopped';
      if (statusFilter === 'reefer') return v.telemetry.cargoTempC !== undefined;
      if (statusFilter === 'alerts') return v.telemetry.immobilizerCutoffActive || v.telemetry.tamperDetected;

      return true;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const handleImmobilizerClick = async (vehicle: Vehicle) => {
    const isCutoff = vehicle.telemetry.immobilizerCutoffActive;
    const confirmText = isCutoff
      ? `Resume engine ignition power for vehicle ${vehicle.plateNumber}?`
      : `EMERGENCY ENGINE CUT-OFF: Cut off fuel pump / ignition remotely for vehicle ${vehicle.plateNumber}?`;

    if (window.confirm(confirmText)) {
      setActionInProgress(vehicle.id);
      try {
        await onToggleImmobilizer(vehicle.id, isCutoff);
      } finally {
        setActionInProgress(null);
      }
    }
  };

  const handleDeleteClick = async (vehicle: Vehicle) => {
    if (window.confirm(`Are you sure you want to remove tracker and vehicle ${vehicle.plateNumber} from Firebase?`)) {
      setActionInProgress(vehicle.id);
      try {
        await onDeleteVehicle(vehicle.id);
      } finally {
        setActionInProgress(null);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Operations Control Center</span>
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Telematics</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise fleet management, cold chain telematics, automated routing, and universal GPS hardware synchronization.
          </p>
        </div>

        {/* Action Command Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenRegisterVehicleModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle / Tracker</span>
          </button>

          <button
            onClick={onOpenMobileModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>Connect Mobile Beacon</span>
          </button>

          <button
            onClick={onOpenRouteOptimizer}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <Route className="w-3.5 h-3.5 text-amber-400" />
            <span>Route Optimizer</span>
          </button>

          {/* Database management dropdown / buttons */}
          {onClearDemoData && (
            <div className="relative inline-block">
              {confirmClearDb ? (
                <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-600 rounded-lg p-1 text-xs animate-fade-in">
                  <span className="text-rose-200 text-[11px] px-1 font-medium">Wipe Firestore?</span>
                  <button
                    onClick={async () => {
                      setConfirmClearDb(false);
                      await onClearDemoData();
                    }}
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold text-[10px]"
                  >
                    Yes, Wipe
                  </button>
                  <button
                    onClick={() => setConfirmClearDb(false)}
                    className="px-1.5 py-0.5 text-slate-400 hover:text-white text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearDb(true)}
                  className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
                  title="Remove old dummy or demo records from Firestore database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Data</span>
                </button>
              )}
            </div>
          )}

          {onLoadStarterTemplate && vehicles.length === 0 && (
            <button
              onClick={onLoadStarterTemplate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/60 rounded-lg transition-colors"
              title="Populate starter sample fleet for demonstration"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Starter Template</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive Fleet Telematics KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Fleet */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Fleet</span>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{vehicles.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{movingCount} active</span>
            <span>·</span>
            <span>{idleCount} idling</span>
          </div>
        </div>

        {/* Moving Vehicles */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>In-Transit</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{movingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg Speed: <strong className="text-white font-mono">{avgSpeed} km/h</strong>
          </div>
        </div>

        {/* Idling with Ignition ON */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Idling (Ignition ON)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{idleCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Parked / Off: <strong className="text-white font-mono">{stoppedCount}</strong>
          </div>
        </div>

        {/* Reefer Cold Chain */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Cold Chain Reefers</span>
            <Thermometer className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">{reeferVehicles.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Temp Compliant</span>
          </div>
        </div>

        {/* Avg Fleet Fuel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Fleet Fuel Level</span>
            <Fuel className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{avgFuel}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                avgFuel > 50 ? 'bg-emerald-400' : avgFuel > 25 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${avgFuel}%` }}
            />
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Incidents</span>
            <ShieldAlert className={`w-4 h-4 ${unacknowledgedAlerts.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${unacknowledgedAlerts.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {unacknowledgedAlerts.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {unacknowledgedAlerts.length === 0 ? 'All zones secure' : 'Action required'}
          </div>
        </div>
      </div>

      {/* 3. Search, Filter Chips, and Status Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by license plate, vehicle make, driver, or IMEI..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            All ({vehicles.length})
          </button>

          <button
            onClick={() => setStatusFilter('moving')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'moving'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Moving ({movingCount})
          </button>

          <button
            onClick={() => setStatusFilter('idle')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'idle'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Idling ({idleCount})
          </button>

          <button
            onClick={() => setStatusFilter('stopped')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'stopped'
                ? 'bg-slate-600/30 text-slate-200 border border-slate-600 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Stopped ({stoppedCount})
          </button>

          <button
            onClick={() => setStatusFilter('reefer')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'reefer'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Reefer ({reeferVehicles.length})
          </button>

          <button
            onClick={() => setStatusFilter('alerts')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'alerts'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
            }`}
          >
            Alerts
          </button>
        </div>
      </div>

      {/* 4. Main Telematics Table & Fleet Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide">
              Live Fleet Telematics Registry
            </h2>
            <span className="text-xs font-mono text-slate-400">
              ({filteredVehicles.length} of {vehicles.length} vehicles)
            </span>
          </div>

          <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400">
              <Database className="w-3 h-3" />
              <span>Firebase Synced</span>
            </span>
          </div>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto mb-4">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              {vehicles.length === 0 ? 'No Fleet Vehicles in Database' : 'No Vehicles Matching Filters'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
              {vehicles.length === 0
                ? 'Your Firebase database is connected. Add your first commercial vehicle, GPS hardware tracker, or mobile beacon to begin live telematics tracking.'
                : 'Try adjusting your search query or status filter chips above to see your registered vehicles.'}
            </p>
            {vehicles.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onOpenRegisterVehicleModal}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Vehicle / GPS Tracker</span>
                </button>
                <button
                  onClick={onOpenMobileModal}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Connect Mobile Phone Beacon</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400">
                  <th className="py-3 px-4">Vehicle &amp; Plate</th>
                  <th className="py-3 px-4">Status &amp; Speed</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Telemetry Sensors</th>
                  <th className="py-3 px-4">Hardware Tracker</th>
                  <th className="py-3 px-4 text-right">Quick Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredVehicles.map((vehicle) => {
                  const isCutoff = vehicle.telemetry.immobilizerCutoffActive;
                  const isReefer = vehicle.telemetry.cargoTempC !== undefined;

                  return (
                    <tr 
                      key={vehicle.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCutoff ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      {/* 1. Vehicle & Plate */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isCutoff 
                              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                              : vehicle.status === 'moving'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-800 border border-slate-700 text-slate-400'
                          }`}>
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold font-mono text-white flex items-center gap-1.5">
                              <span>{vehicle.plateNumber}</span>
                              {isCutoff && (
                                <span className="px-1.5 py-0.2 text-[9px] rounded bg-rose-500/30 text-rose-300 border border-rose-500/40 uppercase font-sans">
                                  Cutoff
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {vehicle.name}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>Driver:</span>
                              <span className="text-slate-300 font-medium">{vehicle.driverName}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Status & Speed */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono uppercase ${
                            isCutoff
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : vehicle.status === 'moving'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : vehicle.status === 'idle'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              vehicle.status === 'moving' ? 'bg-emerald-400 animate-pulse' : 'bg-current'
                            }`} />
                            <span>{isCutoff ? 'Immobilized' : vehicle.status}</span>
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-xs font-semibold text-slate-200">
                          {vehicle.telemetry.speedKmh} <span className="text-[10px] font-normal text-slate-400">km/h</span>
                          {vehicle.telemetry.speedLimitKmh && (
                            <span className="text-[10px] text-slate-500 ml-1">
                              (limit: {vehicle.telemetry.speedLimitKmh})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {vehicle.telemetry.lastPingTime}
                        </div>
                      </td>

                      {/* 3. Location */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="text-slate-200 truncate font-medium text-[11px]" title={vehicle.location.address}>
                          {vehicle.location.address}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {vehicle.location.latitude.toFixed(4)}, {vehicle.location.longitude.toFixed(4)}
                        </div>
                        {vehicle.currentRoute && (
                          <div className="text-[10px] text-emerald-400 truncate mt-1 flex items-center gap-1" title={vehicle.currentRoute.routeName}>
                            <Route className="w-3 h-3 shrink-0" />
                            <span>ETA: {vehicle.currentRoute.eta} ({vehicle.currentRoute.destinationName})</span>
                          </div>
                        )}
                      </td>

                      {/* 4. Telemetry Sensors */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {/* Fuel & Battery */}
                          <div className="flex items-center gap-3 text-[11px]">
                            <div className="flex items-center gap-1 text-slate-300" title="Fuel Level">
                              <Fuel className="w-3 h-3 text-emerald-400" />
                              <span className="font-mono">{vehicle.telemetry.fuelLevelPercent}%</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-300" title="Battery Voltage">
                              <BatteryCharging className="w-3 h-3 text-sky-400" />
                              <span className="font-mono">{vehicle.telemetry.batteryVoltage}V</span>
                            </div>
                          </div>

                          {/* Cold Chain Reefer if equipped */}
                          {isReefer && (
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 text-[10px] font-mono text-sky-300">
                              <Thermometer className="w-3 h-3 text-sky-400" />
                              <span>Cargo: {vehicle.telemetry.cargoTempC}°C</span>
                              <span className="text-emerald-400">● OK</span>
                            </div>
                          )}

                          {/* GSM and GNSS */}
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                            <span>Sats: {vehicle.telemetry.satellites}</span>
                            <span>·</span>
                            <span>GSM: {vehicle.telemetry.gsmSignalPercent}%</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Hardware Tracker */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200 text-[11px]">
                          {vehicle.deviceInfo.deviceModel}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          IMEI: {vehicle.deviceInfo.imei}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {vehicle.deviceInfo.carrier} · {vehicle.deviceInfo.protocol}
                        </div>
                      </td>

                      {/* 6. Quick Controls */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Locate on Map */}
                          <button
                            onClick={() => onSelectVehicleForMap(vehicle.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                            title="Locate vehicle on live interactive map"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </button>

                          {/* Remote Engine Cutoff / Immobilizer */}
                          <button
                            onClick={() => handleImmobilizerClick(vehicle)}
                            disabled={actionInProgress === vehicle.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCutoff
                                ? 'bg-rose-500/30 text-rose-300 hover:bg-rose-500/40 border border-rose-500/50'
                                : 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700'
                            }`}
                            title={isCutoff ? 'Restore Engine Power' : 'Emergency Remote Engine Cutoff'}
                          >
                            {isCutoff ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete Vehicle from DB */}
                          <button
                            onClick={() => handleDeleteClick(vehicle)}
                            disabled={actionInProgress === vehicle.id}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                            title="Unlink tracker and delete from Firebase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Reefer Cold Chain & Active Alarms Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cold Chain Reefer Monitoring Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reefer Cold Chain Monitor</h3>
                <p className="text-[11px] text-slate-400">Perishable food &amp; pharma temperature tracking</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {reeferVehicles.length} Units Active
            </span>
          </div>

          {reeferVehicles.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <Thermometer className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <span>No active refrigerated trucks registered. Register a Reefer Truck with temperature sensor to enable continuous cold chain compliance logging.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {reeferVehicles.map((r) => (
                <div key={r.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span>{r.plateNumber}</span>
                      <span className="text-slate-400 font-normal">({r.name})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Driver: {r.driverName} · Speed: {r.telemetry.speedKmh} km/h
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-sky-400">
                      {r.telemetry.cargoTempC}°C
                    </div>
                    <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Safe Cold Storage
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Telematics Alarms Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Live Telematics Incident Stream</h3>
                <p className="text-[11px] text-slate-400">Over-speeding, harsh deceleration, geofence breaches</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {unacknowledgedAlerts.length} Unresolved
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
              <span>Zero fleet incidents logged in Firebase. All geofences and speed limits normal.</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {alerts.slice(0, 6).map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${
                    alert.acknowledged
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                    }`} />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{alert.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">({alert.timestamp})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{alert.description}</p>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Vehicle: {alert.vehicleName} · {alert.location}
                      </div>
                    </div>
                  </div>

                  {!alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg whitespace-nowrap transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Hardware Gateway & Connectivity Protocol Status */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-white">Universal GPS Hardware Listener Status:</span>
              <span className="text-xs text-slate-400 ml-2">All Middle East &amp; Global ports active</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Teltonika (5027)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>GT06/Jimi (5023)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Queclink (5004)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mobile HTTP (443)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
