/**
 * GWTrax Fleet & Telematics Type Definitions
 */

export interface Vehicle {
  id: string;
  plateNumber: string;
  name: string;
  type: 'heavy_truck' | 'reefer_truck' | 'delivery_van' | 'tanker' | 'flatbed';
  driverId: string;
  driverName: string;
  status: 'moving' | 'idle' | 'stopped' | 'offline' | 'alert';
  location: {
    latitude: number;
    longitude: number;
    address: number | string;
    city: string;
    country: string;
  };
  telemetry: {
    speedKmh: number;
    speedLimitKmh: number;
    headingDeg: number;
    ignition: boolean;
    fuelLevelPercent: number;
    fuelCapacityLiters: number;
    engineRpm: number;
    coolantTempC: number;
    cargoTempC?: number; // For reefer cold chain
    batteryVoltage: number;
    odometerKm: number;
    satellites: number;
    gsmSignalPercent: number;
    immobilizerCutoffActive: boolean;
    tamperDetected: boolean;
    lastPingTime: string;
  };
  deviceInfo: {
    imei: string;
    deviceModel: string;
    brand: string;
    protocol: string;
    port: number;
    firmwareVersion: string;
    simImsi: string;
    carrier: string;
    compliance: string; // e.g., "UAE SIRA / SecurePath Approved" | "Saudi WASL Approved"
  };
  currentRoute?: {
    routeName: string;
    destinationName: string;
    eta: string;
    distanceRemainingKm: number;
  };
  historyTrail: [number, number][]; // recent lat/lng path
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'polygon' | 'circle';
  center?: [number, number];
  radiusMeters?: number;
  coordinates?: [number, number][];
  category: 'logistics_hub' | 'port' | 'industrial' | 'restricted' | 'customer';
  speedLimitKmh: number;
  color: string;
  activeVehiclesInside: string[];
}

export interface FleetAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  driverName: string;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'speeding' | 'harsh_braking' | 'geofence_breach' | 'cargo_temp_spike' | 'fuel_siphoning' | 'immobilizer' | 'sos_panic' | 'dms_distraction';
  title: string;
  description: string;
  location: string;
  acknowledged: boolean;
}
