/**
 * GWTrax — Enterprise Fleet Telematics & Route Optimization
 * Tagline: Track Smart. Move Better
 * Powered by Google Cloud Firestore Persistent Storage
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { OverviewDashboardView } from './components/OverviewDashboardView.tsx';
import { FleetMap } from './components/FleetMap.tsx';
import { RouteOptimizerView } from './components/RouteOptimizerView.tsx';
import { DriverPerformanceView } from './components/DriverPerformanceView.tsx';
import { DeviceAdvisorView } from './components/DeviceAdvisorView.tsx';
import { GeofenceAlertsView } from './components/GeofenceAlertsView.tsx';
import { ConnectMobileModal } from './components/ConnectMobileModal.tsx';
import { RegisterVehicleModal } from './components/RegisterVehicleModal.tsx';
import { 
  INITIAL_VEHICLES, 
  INITIAL_DRIVERS, 
  INITIAL_GEOFENCES, 
  INITIAL_ALERTS 
} from './data/mockFleetData.ts';
import { Vehicle, GeofenceZone, FleetAlert } from './types/fleet.ts';
import { DriverMetrics } from './utils/driverScoring.ts';
import { ParsedGpsTelemetry } from './utils/gpsProtocols.ts';
import { RouteWaypoint } from './utils/routeOptimizer.ts';
import { 
  db,
  testFirestoreConnection,
  subscribeVehicles,
  saveVehicleToFirestore,
  updateVehicleTelemetryInFirestore,
  deleteVehicleFromFirestore,
  subscribeDrivers,
  saveDriverToFirestore,
  deleteDriverFromFirestore,
  subscribeGeofences,
  saveGeofenceToFirestore,
  deleteGeofenceFromFirestore,
  subscribeAlerts,
  saveAlertToFirestore,
  acknowledgeAlertInFirestore,
  deleteAlertFromFirestore,
  saveDispatchedRouteToFirestore,
  clearCollectionInFirestore
} from './services/firebase.ts';
import { Database, CheckCircle2, RefreshCw, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'routes' | 'drivers' | 'devices' | 'alerts'>('dashboard');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverMetrics[]>([]);
  const [geofences, setGeofences] = useState<GeofenceZone[]>([]);
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [isDbProcessing, setIsDbProcessing] = useState<boolean>(false);
  const [dbNotification, setDbNotification] = useState<string | null>(null);

  // Initialize and subscribe to Firestore
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setFirebaseConnected(connected);
    });

    // Real-time Vehicle listener
    const unsubVehicles = subscribeVehicles(
      (remoteVehicles) => {
        setVehicles(remoteVehicles);
        if (remoteVehicles.length > 0 && !selectedVehicleId) {
          setSelectedVehicleId(remoteVehicles[0].id);
        }
      },
      (err) => console.error('Vehicles sync error:', err)
    );

    // Real-time Driver listener
    const unsubDrivers = subscribeDrivers(
      (remoteDrivers) => {
        setDrivers(remoteDrivers);
      },
      (err) => console.error('Drivers sync error:', err)
    );

    // Real-time Geofence listener
    const unsubGeofences = subscribeGeofences(
      (remoteGeofences) => {
        setGeofences(remoteGeofences);
      },
      (err) => console.error('Geofences sync error:', err)
    );

    // Real-time Alerts listener
    const unsubAlerts = subscribeAlerts(
      (remoteAlerts) => {
        setAlerts(remoteAlerts);
      },
      (err) => console.error('Alerts sync error:', err)
    );

    return () => {
      unsubVehicles();
      unsubDrivers();
      unsubGeofences();
      unsubAlerts();
    };
  }, []);

  // Helper for status banner notification
  const showNotification = (msg: string) => {
    setDbNotification(msg);
    setTimeout(() => setDbNotification(null), 4000);
  };

  // Optional manual loader for starter sample fleet
  const handleLoadStarterTemplate = async () => {
    setIsDbProcessing(true);
    try {
      for (const v of INITIAL_VEHICLES) {
        await saveVehicleToFirestore(v);
      }
      for (const d of INITIAL_DRIVERS) {
        await saveDriverToFirestore(d);
      }
      for (const g of INITIAL_GEOFENCES) {
        await saveGeofenceToFirestore(g);
      }
      for (const a of INITIAL_ALERTS) {
        await saveAlertToFirestore(a);
      }
      showNotification('Starter fleet template loaded into Firebase Firestore.');
    } catch (e) {
      console.error('Error loading starter template:', e);
    } finally {
      setIsDbProcessing(false);
    }
  };

  // Clear demo/dummy records from Firestore
  const handleClearDemoData = async () => {
    setIsDbProcessing(true);
    try {
      await clearCollectionInFirestore('vehicles');
      await clearCollectionInFirestore('alerts');
      await clearCollectionInFirestore('geofences');
      await clearCollectionInFirestore('drivers');
      setVehicles([]);
      setAlerts([]);
      setGeofences([]);
      setDrivers([]);
      setSelectedVehicleId(null);
      showNotification('All demo/dummy data removed from Firebase Firestore. Ready for live fleet devices.');
    } catch (e) {
      console.error('Error clearing Firestore records:', e);
    } finally {
      setIsDbProcessing(false);
    }
  };

  // Real-Time GPS Movement Simulation Engine (runs when toggled on and vehicles exist)
  useEffect(() => {
    if (!isSimulating || vehicles.length === 0) return;

    const intervalTime = Math.max(500, 1500 / simulationSpeed);

    const timer = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          // If stopped or immobilizer active, do not move
          if (v.status === 'stopped' || v.telemetry.immobilizerCutoffActive) {
            return {
              ...v,
              telemetry: {
                ...v.telemetry,
                speedKmh: 0,
                lastPingTime: 'Just now'
              }
            };
          }

          // If idle, fluctuate RPM slightly
          if (v.status === 'idle') {
            return {
              ...v,
              telemetry: {
                ...v.telemetry,
                speedKmh: 0,
                engineRpm: Math.floor(720 + Math.random() * 40),
                fuelLevelPercent: Math.max(1, Number((v.telemetry.fuelLevelPercent - 0.01).toFixed(2))),
                lastPingTime: 'Just now'
              }
            };
          }

          // Move along heading: convert heading to delta lat/lng
          const rad = (v.telemetry.headingDeg * Math.PI) / 180;
          const speedFactor = (v.telemetry.speedKmh / 3600) * (intervalTime / 1000) * 0.01;
          const dLat = Math.cos(rad) * speedFactor;
          const dLng = Math.sin(rad) * speedFactor;

          const newLat = Number((v.location.latitude + dLat).toFixed(6));
          const newLng = Number((v.location.longitude + dLng).toFixed(6));

          // Speed fluctuation
          const deltaSpeed = Math.floor((Math.random() - 0.5) * 4);
          const newSpeed = Math.max(25, Math.min(84, v.telemetry.speedKmh + deltaSpeed));
          const newHeading = (v.telemetry.headingDeg + Math.floor((Math.random() - 0.5) * 2) + 360) % 360;

          let newCargoTemp = v.telemetry.cargoTempC;
          if (newCargoTemp !== undefined) {
            newCargoTemp = Number((newCargoTemp + (Math.random() - 0.5) * 0.1).toFixed(1));
          }

          const updatedTrail: [number, number][] = [
            ...(v.historyTrail || []).slice(-15),
            [newLat, newLng]
          ];

          return {
            ...v,
            location: {
              ...v.location,
              latitude: newLat,
              longitude: newLng
            },
            telemetry: {
              ...v.telemetry,
              speedKmh: newSpeed,
              headingDeg: newHeading,
              cargoTempC: newCargoTemp,
              fuelLevelPercent: Math.max(5, Number((v.telemetry.fuelLevelPercent - 0.005).toFixed(2))),
              odometerKm: v.telemetry.odometerKm + Math.round(newSpeed * (intervalTime / 3600000)),
              lastPingTime: 'Just now'
            },
            historyTrail: updatedTrail
          };
        })
      );
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, vehicles.length]);

  // Handler for Remote Engine Immobilizer Cut-off (persists to Firestore)
  const handleToggleImmobilizer = async (vehicleId: string, currentCutoff: boolean) => {
    const newCutoff = !currentCutoff;
    const updatePayload: Partial<Vehicle> = {
      status: newCutoff ? 'stopped' : 'idle',
      telemetry: {
        ...(vehicles.find((v) => v.id === vehicleId)?.telemetry || ({} as any)),
        immobilizerCutoffActive: newCutoff,
        speedKmh: newCutoff ? 0 : 0,
        ignition: !newCutoff,
        lastPingTime: 'Just now'
      }
    };

    // Update local state immediately
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, ...updatePayload } : v))
    );

    try {
      await updateVehicleTelemetryInFirestore(vehicleId, updatePayload);
      showNotification(
        newCutoff
          ? `Engine ignition CUT-OFF activated remotely for ${vehicleId} in Firestore.`
          : `Engine power RESTORED for ${vehicleId} in Firestore.`
      );
    } catch (e) {
      console.error('Failed to update immobilizer state:', e);
    }
  };

  // Handler for Deleting Vehicle from Firestore
  const handleDeleteVehicle = async (vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    if (selectedVehicleId === vehicleId) {
      setSelectedVehicleId(null);
    }
    try {
      await deleteVehicleFromFirestore(vehicleId);
      showNotification(`Vehicle ${vehicleId} deleted from Firebase Firestore.`);
    } catch (e) {
      console.error('Failed to delete vehicle:', e);
    }
  };

  // Handler for Acknowledging Alert in Firestore
  const handleAcknowledgeAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    try {
      await acknowledgeAlertInFirestore(alertId);
      showNotification('Incident alert marked as acknowledged in Firestore.');
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    }
  };

  // Handler for Registering New Vehicle from Modal
  const handleRegisterNewVehicle = async (newVehicle: Vehicle) => {
    setVehicles((prev) => [newVehicle, ...prev]);
    setSelectedVehicleId(newVehicle.id);
    setActiveTab('dashboard');

    try {
      await saveVehicleToFirestore(newVehicle);
      showNotification(`Vehicle ${newVehicle.plateNumber} stored persistently in Firebase!`);
    } catch (e) {
      console.error('Failed to register vehicle in Firestore:', e);
      throw e;
    }
  };

  // Handler for Live Mobile Phone Geolocation Update (persists to Firestore)
  const handleUpdateMobileVehicle = async (mobileVehicle: Vehicle) => {
    setVehicles((prev) => {
      const exists = prev.some((v) => v.id === mobileVehicle.id);
      if (exists) {
        return prev.map((v) => (v.id === mobileVehicle.id ? mobileVehicle : v));
      }
      return [mobileVehicle, ...prev];
    });
    setSelectedVehicleId(mobileVehicle.id);

    try {
      await saveVehicleToFirestore(mobileVehicle);
    } catch (e) {
      console.error('Failed to save mobile beacon to Firestore:', e);
    }
  };

  // Handler for Over-The-Air Route Dispatch (Persists to Firestore)
  const handleDispatchRouteToVehicle = async (
    vehicleId: string,
    routeName: string,
    stops: RouteWaypoint[]
  ) => {
    const destination = stops[stops.length - 1];
    const routeUpdate = {
      status: 'moving' as const,
      currentRoute: {
        routeName,
        destinationName: destination?.name || 'Assigned Logistics Dock',
        eta: destination?.eta || '12:30 PM',
        distanceRemainingKm: 42.5
      }
    };

    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, ...routeUpdate } : v))
    );

    try {
      await updateVehicleTelemetryInFirestore(vehicleId, routeUpdate);
      await saveDispatchedRouteToFirestore({
        id: `route-${Date.now()}`,
        name: routeName,
        assignedVehicleId: vehicleId,
        waypoints: stops,
        totalDistanceKm: 42.5,
        status: 'dispatched'
      });
      showNotification(`Route dispatched and saved to Firebase for vehicle ${vehicleId}!`);
    } catch (e) {
      console.error('Failed to sync route dispatch to Firestore:', e);
    }
  };

  // Handler for Raw Telemetry Packet Ingestion & Sync (Persists to Firestore)
  const handleSyncDecodedTelemetryToFleet = async (telemetry: ParsedGpsTelemetry) => {
    const target = vehicles.find((v) => v.deviceInfo.imei === telemetry.imei) || vehicles[0];
    if (!target) return;

    const updatedVehicle: Vehicle = {
      ...target,
      location: {
        ...target.location,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        address: `Live GPS Fix: ${telemetry.latitude.toFixed(4)}, ${telemetry.longitude.toFixed(4)}`
      },
      telemetry: {
        ...target.telemetry,
        speedKmh: telemetry.speedKmh,
        headingDeg: telemetry.headingDeg,
        satellites: telemetry.satellites,
        batteryVoltage: telemetry.batteryVolt,
        fuelLevelPercent: telemetry.fuelLevelPercent || target.telemetry.fuelLevelPercent,
        ignition: telemetry.ignition,
        lastPingTime: 'Just now'
      },
      historyTrail: [...target.historyTrail, [telemetry.latitude, telemetry.longitude]]
    };

    setVehicles((prev) => prev.map((v) => (v.id === target.id ? updatedVehicle : v)));
    setSelectedVehicleId(target.id);
    setActiveTab('map');

    try {
      await saveVehicleToFirestore(updatedVehicle);
      showNotification(`Decoded GPS packet for ${target.plateNumber} written to Firestore!`);
    } catch (e) {
      console.error('Failed to save decoded telemetry to Firestore:', e);
    }
  };

  // Handler for Geofences state update in Firestore
  const handleSetGeofences = (newGeofencesOrUpdater: React.SetStateAction<GeofenceZone[]>) => {
    setGeofences((prev) => {
      const updated = typeof newGeofencesOrUpdater === 'function' ? newGeofencesOrUpdater(prev) : newGeofencesOrUpdater;
      // Sync additions
      updated.forEach((g) => {
        if (!prev.some((p) => p.id === g.id)) {
          saveGeofenceToFirestore(g).catch((err) =>
            console.error('Error saving geofence to Firestore:', err)
          );
        }
      });
      // Sync deletions
      prev.forEach((p) => {
        if (!updated.some((u) => u.id === p.id)) {
          deleteGeofenceFromFirestore(p.id).catch((err) =>
            console.error('Error deleting geofence in Firestore:', err)
          );
        }
      });
      return updated;
    });
  };

  // Handler for Alerts state update in Firestore
  const handleSetAlerts = (newAlertsOrUpdater: React.SetStateAction<FleetAlert[]>) => {
    setAlerts((prev) => {
      const updated = typeof newAlertsOrUpdater === 'function' ? newAlertsOrUpdater(prev) : newAlertsOrUpdater;
      updated.forEach((a) => {
        const old = prev.find((o) => o.id === a.id);
        if (old && !old.acknowledged && a.acknowledged) {
          acknowledgeAlertInFirestore(a.id).catch((err) =>
            console.error('Error acknowledging alert in Firestore:', err)
          );
        }
      });
      return updated;
    });
  };

  const unacknowledgedAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        unacknowledgedAlertsCount={unacknowledgedAlertsCount}
        onOpenMobileModal={() => setIsMobileModalOpen(true)}
        onOpenRegisterVehicleModal={() => setIsRegisterModalOpen(true)}
      />

      {/* Cloud Persistence Status Sub-Bar */}
      <div className="bg-slate-950 border-b border-slate-900 px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Database className="w-3.5 h-3.5" />
            <span className="font-semibold">Firebase Firestore:</span>
            <span className="text-slate-300">Live Active</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <div className="text-slate-400 hidden sm:flex items-center gap-2">
            <span>Vehicles: <strong className="text-white">{vehicles.length}</strong></span>
            <span>·</span>
            <span>Drivers: <strong className="text-white">{drivers.length}</strong></span>
            <span>·</span>
            <span>Geofences: <strong className="text-white">{geofences.length}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {dbNotification && (
            <span className="text-emerald-400 font-sans flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{dbNotification}</span>
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-sans font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Register Tracker</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <OverviewDashboardView
            vehicles={vehicles}
            drivers={drivers}
            geofences={geofences}
            alerts={alerts}
            onSelectVehicleForMap={(vehicleId) => {
              setSelectedVehicleId(vehicleId);
              setActiveTab('map');
            }}
            onOpenRegisterVehicleModal={() => setIsRegisterModalOpen(true)}
            onOpenMobileModal={() => setIsMobileModalOpen(true)}
            onOpenRouteOptimizer={() => setActiveTab('routes')}
            onToggleImmobilizer={handleToggleImmobilizer}
            onDeleteVehicle={handleDeleteVehicle}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onClearDemoData={handleClearDemoData}
            onLoadStarterTemplate={handleLoadStarterTemplate}
          />
        )}

        {activeTab === 'map' && (
          <FleetMap
            vehicles={vehicles}
            setVehicles={setVehicles}
            geofences={geofences}
            selectedVehicleId={selectedVehicleId}
            setSelectedVehicleId={setSelectedVehicleId}
            onOpenRouteOptimizer={() => setActiveTab('routes')}
          />
        )}

        {activeTab === 'routes' && (
          <RouteOptimizerView
            vehicles={vehicles}
            onDispatchRouteToVehicle={handleDispatchRouteToVehicle}
          />
        )}

        {activeTab === 'drivers' && (
          <DriverPerformanceView drivers={drivers} />
        )}

        {activeTab === 'devices' && (
          <DeviceAdvisorView
            onSyncDecodedTelemetryToFleet={handleSyncDecodedTelemetryToFleet}
            onRegisterNewVehicle={handleRegisterNewVehicle}
          />
        )}

        {activeTab === 'alerts' && (
          <GeofenceAlertsView
            geofences={geofences}
            setGeofences={handleSetGeofences}
            alerts={alerts}
            setAlerts={handleSetAlerts}
          />
        )}
      </main>

      {/* Register New Vehicle & Hardware Modal */}
      <RegisterVehicleModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSaveVehicle={handleRegisterNewVehicle}
      />

      {/* Mobile Phone Connection Modal */}
      <ConnectMobileModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        onUpdateMobileVehicle={handleUpdateMobileVehicle}
      />
    </div>
  );
}
