import React, { useState } from 'react';
import { 
  Route, 
  MapPin, 
  Clock, 
  Fuel, 
  DollarSign, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowRight, 
  TrendingDown, 
  Send, 
  Leaf, 
  Navigation2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { RouteWaypoint, RouteOptimizationResult, optimizeRoute, haversineDistanceKm } from '../utils/routeOptimizer.ts';
import { DUBAI_DEFAULT_OPTIMIZATION_STOPS } from '../data/mockFleetData.ts';
import { Vehicle } from '../types/fleet.ts';

interface RouteOptimizerViewProps {
  vehicles: Vehicle[];
  onDispatchRouteToVehicle: (vehicleId: string, routeName: string, stops: RouteWaypoint[]) => void;
}

export const RouteOptimizerView: React.FC<RouteOptimizerViewProps> = ({
  vehicles,
  onDispatchRouteToVehicle
}) => {
  const [stops, setStops] = useState<RouteWaypoint[]>(DUBAI_DEFAULT_OPTIMIZATION_STOPS);
  const [departureTime, setDepartureTime] = useState('08:00');
  const [returnToDepot, setReturnToDepot] = useState(true);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedVehicleForDispatch, setSelectedVehicleForDispatch] = useState<string>(vehicles[0]?.id || '');
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  // New stop modal/form state
  const [showAddStopForm, setShowAddStopForm] = useState(false);
  const [newStopName, setNewStopName] = useState('');
  const [newStopAddress, setNewStopAddress] = useState('');
  const [newStopLat, setNewStopLat] = useState('25.2048');
  const [newStopLng, setNewStopLng] = useState('55.2708');
  const [newStopTimeStart, setNewStopTimeStart] = useState('11:00');
  const [newStopTimeEnd, setNewStopTimeEnd] = useState('14:00');
  const [newStopWeightKg, setNewStopWeightKg] = useState('250');

  // Trigger automated route optimization
  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const result = optimizeRoute(stops, departureTime, returnToDepot);
      setOptimizationResult(result);
      setIsOptimizing(false);
    }, 400);
  };

  // Add new stop
  const handleAddStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopName.trim()) return;

    const lat = parseFloat(newStopLat) || 25.1972;
    const lng = parseFloat(newStopLng) || 55.2744;

    const newWaypoint: RouteWaypoint = {
      id: `stop-${Date.now()}`,
      name: newStopName,
      address: newStopAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
      type: 'delivery',
      timeWindowStart: newStopTimeStart,
      timeWindowEnd: newStopTimeEnd,
      demandKg: parseInt(newStopWeightKg, 10) || 100,
      serviceTimeMin: 20,
      status: 'pending'
    };

    const updatedStops = [...stops, newWaypoint];
    setStops(updatedStops);
    setShowAddStopForm(false);
    setNewStopName('');
    setNewStopAddress('');
    
    // Auto recompute if already optimized
    if (optimizationResult) {
      setOptimizationResult(optimizeRoute(updatedStops, departureTime, returnToDepot));
    }
  };

  // Remove stop
  const handleRemoveStop = (id: string) => {
    if (stops.length <= 2) return;
    const updated = stops.filter((s) => s.id !== id);
    setStops(updated);
    if (optimizationResult) {
      setOptimizationResult(optimizeRoute(updated, departureTime, returnToDepot));
    }
  };

  // Dispatch route to vehicle
  const handleDispatch = () => {
    const activeStops = optimizationResult ? optimizationResult.optimizedOrder : stops;
    onDispatchRouteToVehicle(
      selectedVehicleForDispatch,
      `Optimized Dispatch (${activeStops.length} Waypoints)`,
      activeStops
    );
    const targetVehicle = vehicles.find((v) => v.id === selectedVehicleForDispatch);
    setDispatchSuccessMsg(
      `Route successfully transmitted over cellular MQTT/FOTA to ${targetVehicle?.plateNumber || 'vehicle'}. Driver notified with turn-by-turn waypoints.`
    );
    setTimeout(() => setDispatchSuccessMsg(null), 5000);
  };

  const displayOrder = optimizationResult ? optimizationResult.optimizedOrder : stops;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Route className="w-3.5 h-3.5" />
            <span>Automated Fleet Routing Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Automated Route Optimization &amp; Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Solves multi-stop Traveling Salesperson (TSP) constraints, traffic time-windows, and reduces diesel costs across Middle East logistics corridors.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddStopForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Waypoint</span>
          </button>

          <button
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-transform active:scale-95 shadow-md shadow-emerald-500/10"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isOptimizing ? 'Optimizing Matrix...' : 'Run Route Optimization'}</span>
          </button>
        </div>
      </div>

      {/* Dispatch confirmation banner */}
      {dispatchSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{dispatchSuccessMsg}</span>
        </div>
      )}

      {/* Before vs After Optimization KPI Grid (Visible once calculated or previewed) */}
      {optimizationResult && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Distance Saved */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Distance Saved</span>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
              -{optimizationResult.distanceSavedKm} <span className="text-xs font-normal text-slate-400">km</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {optimizationResult.percentageDistanceSaved}% shorter path
            </div>
          </div>

          {/* Time Saved */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Drive Time Saved</span>
              <Clock className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-white">
              -{optimizationResult.timeSavedMin} <span className="text-xs font-normal text-slate-400">mins</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Total {optimizationResult.optimizedDurationMin} min transit
            </div>
          </div>

          {/* Fuel Saved */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Fuel Saved</span>
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-amber-300">
              {optimizationResult.fuelSavedLiters} <span className="text-xs font-normal text-slate-400">L</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Diesel @ 28.5L/100km
            </div>
          </div>

          {/* Cost Saved */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Cost Saved (AED / SAR)</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-xl font-bold text-white">
              AED {optimizationResult.fuelCostSavedAed}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              SAR {optimizationResult.fuelCostSavedSar} · ${optimizationResult.fuelCostSavedUsd}
            </div>
          </div>

          {/* Carbon Footprint */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl col-span-2 md:col-span-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>CO2 Reduced</span>
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-emerald-400">
              {optimizationResult.co2SavedKg} <span className="text-xs font-normal text-slate-400">kg</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              ESG Compliance Ready
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout: Waypoints Table & Dispatch Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Waypoint Sequence Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Waypoint Dispatch Itinerary</span>
              <span className="text-xs font-mono text-slate-400">({stops.length} stops)</span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnToDepot}
                  onChange={(e) => {
                    setReturnToDepot(e.target.checked);
                    if (optimizationResult) {
                      setOptimizationResult(optimizeRoute(stops, departureTime, e.target.checked));
                    }
                  }}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span>Return to Depot Loop</span>
              </label>

              <div className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Start:</span>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Waypoint / Location</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Time Window</th>
                  <th className="py-2.5 px-3">ETA</th>
                  <th className="py-2.5 px-3">Cargo</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {displayOrder.map((wp, index) => {
                  const isDepot = wp.type === 'depot';
                  return (
                    <tr key={wp.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{wp.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                          {wp.address}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                            isDepot
                              ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          {wp.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                        {wp.timeWindowStart} – {wp.timeWindowEnd}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-400 font-bold text-[11px]">
                        {wp.eta || 'Pending'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300 text-[11px]">
                        {wp.demandKg > 0 ? `${wp.demandKg} kg` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isDepot && (
                          <button
                            onClick={() => handleRemoveStop(wp.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            title="Remove waypoint"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Turn-by-Turn Leg Breakdown & Dispatch Action */}
        <div className="space-y-4">
          {/* Dispatch to Vehicle Box */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Over-the-Air Route Dispatch</span>
            </h3>
            <p className="text-xs text-slate-400">
              Transmit optimized sequence directly to driver telematics display or smartphone app.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400 uppercase">Select Target Fleet Vehicle</label>
              <select
                value={selectedVehicleForDispatch}
                onChange={(e) => setSelectedVehicleForDispatch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} · {v.name.split('(')[0]} ({v.driverName})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDispatch}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-transform active:scale-95"
            >
              <Navigation2 className="w-4 h-4" />
              <span>Dispatch Optimized Itinerary Now</span>
            </button>
          </div>

          {/* Turn-by-Turn Route Legs */}
          {optimizationResult && (
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3 max-h-[380px] overflow-y-auto">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Calculated Leg Distances</span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  Total {optimizationResult.optimizedDistanceKm} km
                </span>
              </div>

              <div className="space-y-2.5">
                {optimizationResult.legs.map((leg, i) => (
                  <div key={i} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span className="truncate max-w-[140px]">{leg.fromName.split(' ')[0]}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="truncate max-w-[140px] text-white">{leg.toName.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/50">
                      <span>{leg.distanceKm} km ({leg.durationMin} min)</span>
                      <span className="text-emerald-400 font-semibold">ETA {leg.eta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Stop Modal */}
      {showAddStopForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white">Add Delivery Waypoint</h3>
            <p className="text-xs text-slate-400 mt-1">Insert destination coordinates into dispatch list.</p>

            <form onSubmit={handleAddStop} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Waypoint / Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dubai Festival City Logistics Hub"
                  value={newStopName}
                  onChange={(e) => setNewStopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Address / Landmark</label>
                <input
                  type="text"
                  placeholder="e.g. Al Badia Blvd, Dubai"
                  value={newStopAddress}
                  onChange={(e) => setNewStopAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Latitude</label>
                  <input
                    type="text"
                    value={newStopLat}
                    onChange={(e) => setNewStopLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Longitude</label>
                  <input
                    type="text"
                    value={newStopLng}
                    onChange={(e) => setNewStopLng(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Window Start</label>
                  <input
                    type="time"
                    value={newStopTimeStart}
                    onChange={(e) => setNewStopTimeStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Window End</label>
                  <input
                    type="time"
                    value={newStopTimeEnd}
                    onChange={(e) => setNewStopTimeEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cargo (kg)</label>
                  <input
                    type="number"
                    value={newStopWeightKg}
                    onChange={(e) => setNewStopWeightKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStopForm(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded"
                >
                  Save Waypoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
