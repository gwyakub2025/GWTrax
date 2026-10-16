import React, { useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  Plus, 
  Trash2, 
  BellOff, 
  Eye, 
  Filter, 
  Gauge, 
  Layers
} from 'lucide-react';
import { GeofenceZone, FleetAlert } from '../types/fleet.ts';

interface GeofenceAlertsViewProps {
  geofences: GeofenceZone[];
  setGeofences: React.Dispatch<React.SetStateAction<GeofenceZone[]>>;
  alerts: FleetAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<FleetAlert[]>>;
}

export const GeofenceAlertsView: React.FC<GeofenceAlertsViewProps> = ({
  geofences,
  setGeofences,
  alerts,
  setAlerts
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'geofences'>('alerts');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showAddGeofence, setShowAddGeofence] = useState(false);

  // New Geofence form
  const [geoName, setGeoName] = useState('');
  const [geoCategory, setGeoCategory] = useState<GeofenceZone['category']>('logistics_hub');
  const [geoSpeedLimit, setGeoSpeedLimit] = useState('40');
  const [geoRadius, setGeoRadius] = useState('2500');
  const [geoColor, setGeoColor] = useState('#3b82f6');

  // Filtered alerts
  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter === 'all') return true;
    return a.severity === severityFilter;
  });

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const handleAcknowledgeAll = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  };

  const handleAddGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geoName.trim()) return;

    const newZone: GeofenceZone = {
      id: `geo-${Date.now()}`,
      name: geoName,
      type: 'circle',
      category: geoCategory,
      speedLimitKmh: parseInt(geoSpeedLimit, 10) || 40,
      color: geoColor,
      center: [25.1972, 55.2744],
      radiusMeters: parseInt(geoRadius, 10) || 2000,
      activeVehiclesInside: []
    };

    setGeofences([...geofences, newZone]);
    setShowAddGeofence(false);
    setGeoName('');
  };

  const handleDeleteGeofence = (id: string) => {
    setGeofences(geofences.filter((g) => g.id !== id));
  };

  // Export CSV of alerts
  const handleExportCsv = () => {
    const headers = 'Alert ID,Vehicle,Driver,Severity,Type,Title,Location,Timestamp,Status\n';
    const rows = alerts
      .map(
        (a) =>
          `"${a.id}","${a.vehicleName}","${a.driverName}","${a.severity}","${a.type}","${a.title}","${a.location}","${a.timestamp}","${
            a.acknowledged ? 'Acknowledged' : 'Pending'
          }"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gwtrax_telematics_alerts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Automated Boundary Security &amp; Safety Alarms</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Geofence Zones &amp; Real-Time Telematics Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time entry/exit perimeter notifications, speed corridor enforcement, harsh event triggers, and emergency cut-offs.
          </p>
        </div>

        {/* Sub-tab switch & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveSubTab('alerts')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'alerts' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Alert Feed ({alerts.filter((a) => !a.acknowledged).length} Unread)
            </button>
            <button
              onClick={() => setActiveSubTab('geofences')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'geofences' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Geofence Boundaries ({geofences.length})
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ALERT FEED */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Filter Severity:</span>
              {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                    severityFilter === sev
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button
              onClick={handleAcknowledgeAll}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge All Alarms</span>
            </button>
          </div>

          {/* Alert Cards List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-500 text-xs">
                No active telematics alerts matching the selected filter.
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-slate-900/90 border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    alert.acknowledged
                      ? 'border-slate-800/80 opacity-75'
                      : alert.severity === 'critical'
                      ? 'border-rose-500/40 shadow-sm shadow-rose-500/5'
                      : alert.severity === 'warning'
                      ? 'border-amber-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          alert.severity === 'critical'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : alert.severity === 'warning'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                      <span>Vehicle: <strong className="text-white">{alert.vehicleName}</strong></span>
                      <span>Driver: <strong className="text-slate-200">{alert.driverName}</strong></span>
                      <span>Location: {alert.location}</span>
                      <span>Time: {alert.timestamp}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {alert.acknowledged ? (
                      <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Resolved</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-colors border border-slate-700"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: GEOFENCE BOUNDARIES */}
      {activeSubTab === 'geofences' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Configured Virtual Geofences</span>
            </h2>
            <button
              onClick={() => setShowAddGeofence(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Geofence Zone</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {geofences.map((geo) => (
              <div
                key={geo.id}
                className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: geo.color }}
                        />
                        <h3 className="text-sm font-bold text-white">{geo.name}</h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase mt-0.5 block">
                        Category: {geo.category.replace('_', ' ')} · Type: {geo.type}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteGeofence(geo.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Delete geofence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Speed Limit</span>
                      <span className="text-white font-bold">{geo.speedLimitKmh} km/h</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Vehicles Inside</span>
                      <span className="text-emerald-400 font-bold">
                        {geo.activeVehiclesInside.length > 0 ? geo.activeVehiclesInside.join(', ') : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-800/50">
                  <span>Entry &amp; Exit Push Alerts Enabled</span>
                  <span className="text-emerald-400">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Geofence Modal */}
      {showAddGeofence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white">Define New Geofence Zone</h3>
            <p className="text-xs text-slate-400 mt-1">Configure virtual perimeter boundary.</p>

            <form onSubmit={handleAddGeofence} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khalifa Port Logistics Gate"
                  value={geoName}
                  onChange={(e) => setGeoName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={geoCategory}
                  onChange={(e) => setGeoCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                >
                  <option value="logistics_hub">Logistics Hub / Depot</option>
                  <option value="port">Seaport / Freezone Gate</option>
                  <option value="industrial">Industrial Manufacturing Zone</option>
                  <option value="restricted">Restricted / Low Emission Zone</option>
                  <option value="customer">Customer Warehouse Dock</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Speed Limit (km/h)</label>
                  <input
                    type="number"
                    value={geoSpeedLimit}
                    onChange={(e) => setGeoSpeedLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Radius (Meters)</label>
                  <input
                    type="number"
                    value={geoRadius}
                    onChange={(e) => setGeoRadius(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddGeofence(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded"
                >
                  Save Geofence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
