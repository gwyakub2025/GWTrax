import { Vehicle, GeofenceZone, FleetAlert } from '../types/fleet.ts';
import { DriverMetrics } from '../utils/driverScoring.ts';

export const INITIAL_DRIVERS: DriverMetrics[] = [
  {
    driverId: 'drv-01',
    name: 'Tariq Al-Mansoor',
    avatarUrl: '/src/assets/images/driver_avatar_tariq_1792147471175.jpg',
    assignedVehicle: 'TRK-704 (Actros Reefer)',
    licenseNumber: 'UAE-DXB-984210',
    contactNumber: '+971 50 839 2104',
    yearsExperience: 14,
    totalDistanceKm: 4620,
    totalDriveHours: 112,
    harshBrakingCount: 1,
    harshAccelerationCount: 1,
    harshCorneringCount: 0,
    excessiveIdlingHours: 2.1,
    speedingIncidentsCount: 0,
    dmsDistractionAlerts: 0,
    seatbeltViolations: 0,
    fuelConsumedLiters: 1180,
    idleFuelWastedLiters: 6.8
  },
  {
    driverId: 'drv-02',
    name: 'Arthur Miller',
    avatarUrl: '/src/assets/images/driver_avatar_vikram_1792147471689.jpg',
    assignedVehicle: 'TRK-812 (Volvo Container)',
    licenseNumber: 'UAE-SHJ-443192',
    contactNumber: '+971 55 491 8023',
    yearsExperience: 18,
    totalDistanceKm: 5120,
    totalDriveHours: 128,
    harshBrakingCount: 3,
    harshAccelerationCount: 2,
    harshCorneringCount: 1,
    excessiveIdlingHours: 4.8,
    speedingIncidentsCount: 1,
    dmsDistractionAlerts: 1,
    seatbeltViolations: 0,
    fuelConsumedLiters: 1420,
    idleFuelWastedLiters: 15.4
  },
  {
    driverId: 'drv-03',
    name: 'Liam O\'Connell',
    avatarUrl: '/src/assets/images/driver_avatar_ahmad_1792147471879.jpg',
    assignedVehicle: 'VAN-305 (Ford Transit Express)',
    licenseNumber: 'KSA-RYD-771249',
    contactNumber: '+966 54 819 2301',
    yearsExperience: 5,
    totalDistanceKm: 3100,
    totalDriveHours: 86,
    harshBrakingCount: 6,
    harshAccelerationCount: 5,
    harshCorneringCount: 3,
    excessiveIdlingHours: 7.2,
    speedingIncidentsCount: 3,
    dmsDistractionAlerts: 2,
    seatbeltViolations: 1,
    fuelConsumedLiters: 480,
    idleFuelWastedLiters: 23.0
  },
  {
    driverId: 'drv-04',
    name: 'Farooq Al-Balushi',
    avatarUrl: '/src/assets/images/driver_avatar_tariq_1792147471175.jpg',
    assignedVehicle: 'TANK-401 (MAN Hazmat Fuel)',
    licenseNumber: 'OMN-MCT-338291',
    contactNumber: '+968 92 341 5502',
    yearsExperience: 16,
    totalDistanceKm: 3900,
    totalDriveHours: 98,
    harshBrakingCount: 2,
    harshAccelerationCount: 1,
    harshCorneringCount: 1,
    excessiveIdlingHours: 3.0,
    speedingIncidentsCount: 0,
    dmsDistractionAlerts: 0,
    seatbeltViolations: 0,
    fuelConsumedLiters: 1100,
    idleFuelWastedLiters: 9.6
  },
  {
    driverId: 'drv-05',
    name: 'Zaid Qasim',
    avatarUrl: '/src/assets/images/driver_avatar_ahmad_1792147471879.jpg',
    assignedVehicle: 'VAN-102 (Toyota HiAce)',
    licenseNumber: 'BHR-MAN-502188',
    contactNumber: '+973 39 120 449',
    yearsExperience: 3,
    totalDistanceKm: 2200,
    totalDriveHours: 72,
    harshBrakingCount: 11,
    harshAccelerationCount: 9,
    harshCorneringCount: 5,
    excessiveIdlingHours: 14.5,
    speedingIncidentsCount: 5,
    dmsDistractionAlerts: 4,
    seatbeltViolations: 2,
    fuelConsumedLiters: 390,
    idleFuelWastedLiters: 44.5
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'TRK-704',
    plateNumber: 'DXB-C-9842',
    name: 'Mercedes-Benz Actros 3340 (Reefer Cold-Chain)',
    type: 'reefer_truck',
    driverId: 'drv-01',
    driverName: 'Tariq Al-Mansoor',
    status: 'moving',
    location: {
      latitude: 25.1235,
      longitude: 55.2045,
      address: 'Sheikh Zayed Rd (E11) near Al Barsha',
      city: 'Dubai',
      country: 'United Arab Emirates'
    },
    telemetry: {
      speedKmh: 74,
      speedLimitKmh: 80,
      headingDeg: 215,
      ignition: true,
      fuelLevelPercent: 82,
      fuelCapacityLiters: 450,
      engineRpm: 1480,
      coolantTempC: 88,
      cargoTempC: -21.4, // Frozen Pharmaceuticals
      batteryVoltage: 24.6,
      odometerKm: 148290,
      satellites: 17,
      gsmSignalPercent: 96,
      immobilizerCutoffActive: false,
      tamperDetected: false,
      lastPingTime: 'Just now'
    },
    deviceInfo: {
      imei: '358249091234567',
      deviceModel: 'Teltonika FMC130 (4G Cat 1)',
      brand: 'Teltonika Telematics',
      protocol: 'Codec 8E Extended (TCP 5027)',
      port: 5027,
      firmwareVersion: '03.28.02.Rev.14',
      simImsi: '424021948210384',
      carrier: 'e& (Etisalat UAE)',
      compliance: 'UAE SIRA & SecurePath Certified'
    },
    currentRoute: {
      routeName: 'JAFZA Freezone to Al Ain Cold Hub',
      destinationName: 'Al Ain Cold Logistics Depot',
      eta: '11:45 AM',
      distanceRemainingKm: 68.4
    },
    historyTrail: [
      [25.1972, 55.2744],
      [25.1680, 55.2450],
      [25.1450, 55.2210],
      [25.1235, 55.2045]
    ]
  },
  {
    id: 'TRK-812',
    plateNumber: 'SHJ-E-4431',
    name: 'Volvo FH16 540 (Flatbed Intermodal)',
    type: 'heavy_truck',
    driverId: 'drv-02',
    driverName: 'Arthur Miller',
    status: 'moving',
    location: {
      latitude: 25.0450,
      longitude: 55.1220,
      address: 'Sheikh Mohammed Bin Zayed Rd (E311)',
      city: 'Dubai',
      country: 'United Arab Emirates'
    },
    telemetry: {
      speedKmh: 68,
      speedLimitKmh: 80,
      headingDeg: 45,
      ignition: true,
      fuelLevelPercent: 64,
      fuelCapacityLiters: 600,
      engineRpm: 1540,
      coolantTempC: 91,
      batteryVoltage: 24.2,
      odometerKm: 218450,
      satellites: 15,
      gsmSignalPercent: 92,
      immobilizerCutoffActive: false,
      tamperDetected: false,
      lastPingTime: '12s ago'
    },
    deviceInfo: {
      imei: '358249098765432',
      deviceModel: 'Teltonika FMB120',
      brand: 'Teltonika Telematics',
      protocol: 'Codec 8 (TCP 5027)',
      port: 5027,
      firmwareVersion: '03.27.09.Rev.08',
      simImsi: '424039182390145',
      carrier: 'du UAE',
      compliance: 'UAE SIRA Approved'
    },
    currentRoute: {
      routeName: 'Jebel Ali Port Terminal 2 to Sharjah Industrial',
      destinationName: 'Sharjah Industrial Zone 10',
      eta: '10:30 AM',
      distanceRemainingKm: 34.2
    },
    historyTrail: [
      [25.0112, 55.0617],
      [25.0280, 55.0920],
      [25.0450, 55.1220]
    ]
  },
  {
    id: 'VAN-305',
    plateNumber: 'RYD-7712',
    name: 'Ford Transit Custom (High-Roof Express)',
    type: 'delivery_van',
    driverId: 'drv-03',
    driverName: 'Liam O\'Connell',
    status: 'idle',
    location: {
      latitude: 24.7136,
      longitude: 46.6753,
      address: 'King Fahd Rd / Al Olaya District',
      city: 'Riyadh',
      country: 'Saudi Arabia'
    },
    telemetry: {
      speedKmh: 0,
      speedLimitKmh: 60,
      headingDeg: 180,
      ignition: true, // Idling with AC on in Riyadh heat
      fuelLevelPercent: 88,
      fuelCapacityLiters: 80,
      engineRpm: 750,
      coolantTempC: 92,
      batteryVoltage: 13.8,
      odometerKm: 64120,
      satellites: 18,
      gsmSignalPercent: 98,
      immobilizerCutoffActive: false,
      tamperDetected: false,
      lastPingTime: 'Just now'
    },
    deviceInfo: {
      imei: '867394042817293',
      deviceModel: 'Jimi IoT VL02 (4G Cat 1)',
      brand: 'Jimi IoT / Concox',
      protocol: 'GT06 Protocol (TCP 5023)',
      port: 5023,
      firmwareVersion: 'VL02_V1.3.4_2026',
      simImsi: '420019284719203',
      carrier: 'STC Saudi',
      compliance: 'Saudi TGA WASL API Approved'
    },
    currentRoute: {
      routeName: 'Riyadh Central Retail Hub Dispatch',
      destinationName: 'Kingdom Centre Drop Point',
      eta: '09:50 AM',
      distanceRemainingKm: 4.8
    },
    historyTrail: [
      [24.7300, 46.6800],
      [24.7210, 46.6770],
      [24.7136, 46.6753]
    ]
  },
  {
    id: 'TANK-401',
    plateNumber: 'MCT-3382',
    name: 'MAN TGS 33.480 (Hazmat Petro Chemical)',
    type: 'tanker',
    driverId: 'drv-04',
    driverName: 'Farooq Al-Balushi',
    status: 'moving',
    location: {
      latitude: 23.6143,
      longitude: 58.5453,
      address: 'Sultan Qaboos Highway near Al Ghubrah',
      city: 'Muscat',
      country: 'Oman'
    },
    telemetry: {
      speedKmh: 64,
      speedLimitKmh: 75,
      headingDeg: 310,
      ignition: true,
      fuelLevelPercent: 94,
      fuelCapacityLiters: 800,
      engineRpm: 1420,
      coolantTempC: 86,
      batteryVoltage: 24.8,
      odometerKm: 182300,
      satellites: 16,
      gsmSignalPercent: 88,
      immobilizerCutoffActive: false,
      tamperDetected: false,
      lastPingTime: '8s ago'
    },
    deviceInfo: {
      imei: '358249094819204',
      deviceModel: 'Teltonika FMC130 + AIS 140 Hazmat',
      brand: 'Teltonika Telematics',
      protocol: 'Codec 8E & AIS 140',
      port: 5027,
      firmwareVersion: '03.28.02.Rev.14',
      simImsi: '422029184710294',
      carrier: 'Omantel',
      compliance: 'Oman ROP & GCC Hazmat Transport'
    },
    currentRoute: {
      routeName: 'Mina Al Fahal Refinery to Sohar Industrial Port',
      destinationName: 'Sohar Petrochemical Terminal',
      eta: '01:15 PM',
      distanceRemainingKm: 185.0
    },
    historyTrail: [
      [23.5900, 58.5100],
      [23.6020, 58.5300],
      [23.6143, 58.5453]
    ]
  },
  {
    id: 'VAN-102',
    plateNumber: 'MAN-5021',
    name: 'Toyota HiAce High Roof (E-Commerce Parcels)',
    type: 'delivery_van',
    driverId: 'drv-05',
    driverName: 'Zaid Qasim',
    status: 'stopped',
    location: {
      latitude: 26.2285,
      longitude: 50.5860,
      address: 'Government Ave / Diplomatic Area',
      city: 'Manama',
      country: 'Bahrain'
    },
    telemetry: {
      speedKmh: 0,
      speedLimitKmh: 50,
      headingDeg: 90,
      ignition: false, // Parked at loading bay
      fuelLevelPercent: 42,
      fuelCapacityLiters: 70,
      engineRpm: 0,
      coolantTempC: 45,
      batteryVoltage: 12.6,
      odometerKm: 92800,
      satellites: 14,
      gsmSignalPercent: 94,
      immobilizerCutoffActive: false,
      tamperDetected: false,
      lastPingTime: '1m ago'
    },
    deviceInfo: {
      imei: '860129031948572',
      deviceModel: 'Queclink GV300',
      brand: 'Queclink Wireless',
      protocol: 'Queclink @ACK (TCP 5004)',
      port: 5004,
      firmwareVersion: 'GV300_R01A03V07',
      simImsi: '426019284719203',
      carrier: 'Batelco Bahrain',
      compliance: 'GCC Transport Standard'
    },
    currentRoute: {
      routeName: 'Manama Diplomatic Hub Delivery Loop',
      destinationName: 'Bahrain Financial Harbour',
      eta: '10:00 AM',
      distanceRemainingKm: 2.1
    },
    historyTrail: [
      [26.2210, 50.5750],
      [26.2250, 50.5810],
      [26.2285, 50.5860]
    ]
  }
];

export const INITIAL_GEOFENCES: GeofenceZone[] = [
  {
    id: 'geo-01',
    name: 'JAFZA Freezone & Jebel Ali Port Logistics Zone',
    type: 'polygon',
    category: 'port',
    speedLimitKmh: 40,
    color: '#3b82f6',
    coordinates: [
      [25.0400, 55.0300],
      [25.0400, 55.1100],
      [24.9800, 55.1100],
      [24.9800, 55.0300]
    ],
    activeVehiclesInside: ['TRK-812']
  },
  {
    id: 'geo-02',
    name: 'Dubai South (DWC) Al Maktoum Cargo Hub',
    type: 'polygon',
    category: 'logistics_hub',
    speedLimitKmh: 40,
    color: '#10b981',
    coordinates: [
      [24.9300, 55.1300],
      [24.9300, 55.2200],
      [24.8700, 55.2200],
      [24.8700, 55.1300]
    ],
    activeVehiclesInside: []
  },
  {
    id: 'geo-03',
    name: 'Riyadh Dry Port & Logistics Park',
    type: 'polygon',
    category: 'logistics_hub',
    speedLimitKmh: 35,
    color: '#f59e0b',
    coordinates: [
      [24.6900, 46.7300],
      [24.6900, 46.7900],
      [24.6400, 46.7900],
      [24.6400, 46.7300]
    ],
    activeVehiclesInside: ['VAN-305']
  },
  {
    id: 'geo-04',
    name: 'Downtown Dubai Ultra Low Emission Zone',
    type: 'circle',
    category: 'restricted',
    speedLimitKmh: 50,
    color: '#ef4444',
    center: [25.1972, 55.2744],
    radiusMeters: 2500,
    activeVehiclesInside: []
  }
];

export const INITIAL_ALERTS: FleetAlert[] = [
  {
    id: 'alt-01',
    vehicleId: 'VAN-102',
    vehicleName: 'VAN-102 (HiAce High Roof)',
    driverName: 'Zaid Qasim',
    timestamp: '14 mins ago',
    severity: 'critical',
    type: 'harsh_braking',
    title: 'Harsh Deceleration Event (-0.48G)',
    description: 'Vehicle braked abruptly from 58 km/h to 12 km/h in 1.4 seconds. Front collision warning logged.',
    location: 'King Faisal Hwy near Bahrain Bay',
    acknowledged: false
  },
  {
    id: 'alt-02',
    vehicleId: 'TRK-704',
    vehicleName: 'TRK-704 (Actros Reefer)',
    driverName: 'Tariq Al-Mansoor',
    timestamp: '28 mins ago',
    severity: 'info',
    type: 'geofence_breach',
    title: 'Geofence Exit: JAFZA Logistics Gate 4',
    description: 'Vehicle successfully cleared outbound customs inspection and departed JAFZA geofence zone.',
    location: 'JAFZA Gate 4 Checkpoint, Dubai',
    acknowledged: true
  },
  {
    id: 'alt-03',
    vehicleId: 'VAN-305',
    vehicleName: 'VAN-305 (Ford Transit)',
    driverName: 'Liam O\'Connell',
    timestamp: '42 mins ago',
    severity: 'warning',
    type: 'dms_distraction',
    title: 'AI Camera Alert: Phone Distraction Detected',
    description: 'DMS in-cabin smart camera detected driver holding smartphone while vehicle was in motion (42 km/h).',
    location: 'King Fahd Rd, Riyadh',
    acknowledged: false
  },
  {
    id: 'alt-04',
    vehicleId: 'TANK-401',
    vehicleName: 'TANK-401 (MAN Hazmat)',
    driverName: 'Farooq Al-Balushi',
    timestamp: '1 hour ago',
    severity: 'info',
    type: 'geofence_breach',
    title: 'Entered Geofence: Mina Al Fahal Loading Bay',
    description: 'Hazmat fuel tanker arrived at terminal gantry. Automated SIRA/ROP notification dispatched.',
    location: 'Mina Al Fahal Terminal, Muscat',
    acknowledged: true
  }
];

export const DUBAI_DEFAULT_OPTIMIZATION_STOPS = [
  {
    id: 'depot',
    name: 'Al Quoz Central Dispatch Terminal',
    address: 'Al Quoz Industrial 3, Dubai',
    latitude: 25.1380,
    longitude: 55.2250,
    type: 'depot' as const,
    timeWindowStart: '08:00',
    timeWindowEnd: '18:00',
    demandKg: 0,
    serviceTimeMin: 15,
    status: 'pending' as const
  },
  {
    id: 'stop-1',
    name: 'JAFZA Freezone North Customs Depot',
    address: 'Jebel Ali Freezone, Dubai',
    latitude: 25.0150,
    longitude: 55.0890,
    type: 'delivery' as const,
    timeWindowStart: '09:00',
    timeWindowEnd: '11:00',
    demandKg: 650,
    serviceTimeMin: 20,
    status: 'pending' as const
  },
  {
    id: 'stop-2',
    name: 'Mall of the Emirates Retail Receiving Bay',
    address: 'Al Barsha 1, Dubai',
    latitude: 25.1181,
    longitude: 55.2006,
    type: 'delivery' as const,
    timeWindowStart: '10:30',
    timeWindowEnd: '12:30',
    demandKg: 320,
    serviceTimeMin: 25,
    status: 'pending' as const
  },
  {
    id: 'stop-3',
    name: 'Business Bay Executive Towers Bay 2',
    address: 'Business Bay, Dubai',
    latitude: 25.1850,
    longitude: 55.2680,
    type: 'delivery' as const,
    timeWindowStart: '12:00',
    timeWindowEnd: '14:00',
    demandKg: 180,
    serviceTimeMin: 15,
    status: 'pending' as const
  },
  {
    id: 'stop-4',
    name: 'Dubai Silicon Oasis High-Tech Park',
    address: 'Dubai Silicon Oasis, Dubai',
    latitude: 25.1220,
    longitude: 55.3780,
    type: 'delivery' as const,
    timeWindowStart: '13:30',
    timeWindowEnd: '16:00',
    demandKg: 420,
    serviceTimeMin: 20,
    status: 'pending' as const
  },
  {
    id: 'stop-5',
    name: 'Deira Waterfront Logistics Market',
    address: 'Deira Corniche, Dubai',
    latitude: 25.2750,
    longitude: 55.3050,
    type: 'delivery' as const,
    timeWindowStart: '15:00',
    timeWindowEnd: '17:30',
    demandKg: 500,
    serviceTimeMin: 30,
    status: 'pending' as const
  }
];
