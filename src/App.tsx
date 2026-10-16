/**
 * GWTrax — Enterprise Fleet Telematics & Route Optimization
 * Tagline: Track Smart. Move Better
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { FleetMap } from './components/FleetMap.tsx';
import { RouteOptimizerView } from './components/RouteOptimizerView.tsx';
import { DriverPerformanceView } from './components/DriverPerformanceView.tsx';
import { DeviceAdvisorView } from './components/DeviceAdvisorView.tsx';
import { GeofenceAlertsView } from './components/GeofenceAlertsView.tsx';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'routes' | 'drivers' | 'devices' | 'alerts'>('map');
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<DriverMetrics[]>(INITIAL_DRIVERS);
  const [geofences, setGeofences] = useState<GeofenceZone[]>(INITIAL_GEOFENCES);
  const [alerts, setAlerts] = useState<FleetAlert[]>(INITIAL_ALERTS);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>('TRK-704');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  // Real-Time GPS Movement Simulation Engine
  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = Math.max(400, 1500 / simulationSpeed);

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
          const speedFactor = (v.telemetry.speedKmh / 3600) * (intervalTime / 1000) * 0.01; // lat/lng delta
          const dLat = Math.cos(rad) * speedFactor;
          const dLng = Math.sin(rad) * speedFactor;

          const newLat = Number((v.location.latitude + dLat).toFixed(6));
          const newLng = Number((v.location.longitude + dLng).toFixed(6));

          // Speed fluctuation
          const deltaSpeed = Math.floor((Math.random() - 0.5) * 4);
          const newSpeed = Math.max(25, Math.min(84, v.telemetry.speedKmh + deltaSpeed));

          // Slight heading wobble along curved highway
          const newHeading = (v.telemetry.headingDeg + Math.floor((Math.random() - 0.5) * 2) + 360) % 360;

          // Cargo temperature fluctuation for reefer
          let newCargoTemp = v.telemetry.cargoTempC;
          if (newCargoTemp !== undefined) {
            newCargoTemp = Number((newCargoTemp + (Math.random() - 0.5) * 0.1).toFixed(1));
          }

          // History trail
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
  }, [isSimulating, simulationSpeed]);

  // Handler for Over-The-Air Route Dispatch
  const handleDispatchRouteToVehicle = (
    vehicleId: string,
    routeName: string,
    stops: RouteWaypoint[]
  ) => {
    const destination = stops[stops.length - 1];
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            status: 'moving',
            currentRoute: {
              routeName,
              destinationName: destination?.name || 'Assigned Logistics Dock',
              eta: destination?.eta || '12:30 PM',
              distanceRemainingKm: 42.5
            }
          };
        }
        return v;
      })
    );
  };

  // Handler for Raw Telemetry Packet Ingestion & Sync
  const handleSyncDecodedTelemetryToFleet = (telemetry: ParsedGpsTelemetry) => {
    setVehicles((prev) => {
      // Find matching vehicle or update the selected one
      const target = prev.find((v) => v.deviceInfo.imei === telemetry.imei) || prev[0];
      return prev.map((v) => {
        if (v.id === target.id) {
          return {
            ...v,
            location: {
              ...v.location,
              latitude: telemetry.latitude,
              longitude: telemetry.longitude,
              address: `Live GPS Fix: ${telemetry.latitude.toFixed(4)}, ${telemetry.longitude.toFixed(4)}`
            },
            telemetry: {
              ...v.telemetry,
              speedKmh: telemetry.speedKmh,
              headingDeg: telemetry.headingDeg,
              satellites: telemetry.satellites,
              batteryVoltage: telemetry.batteryVolt,
              fuelLevelPercent: telemetry.fuelLevelPercent || v.telemetry.fuelLevelPercent,
              ignition: telemetry.ignition,
              lastPingTime: 'Just now'
            },
            historyTrail: [...v.historyTrail, [telemetry.latitude, telemetry.longitude]]
          };
        }
        return v;
      });
    });

    setSelectedVehicleId(vehicles[0]?.id || 'TRK-704');
    setActiveTab('map');
  };

  // Handler for Registering New Hardware Device
  const handleRegisterNewVehicle = (newVehicle: Vehicle) => {
    setVehicles((prev) => [newVehicle, ...prev]);
    setSelectedVehicleId(newVehicle.id);
    setActiveTab('map');
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
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-x-hidden">
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
            setGeofences={setGeofences}
            alerts={alerts}
            setAlerts={setAlerts}
          />
        )}
      </main>
    </div>
  );
}
