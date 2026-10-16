import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGpsPacket, GPS_DEVICE_MARKET_TRENDS } from './gpsProtocols.ts';
import { haversineDistanceKm, optimizeRoute, calculateTotalRouteDistance, type RouteWaypoint } from './routeOptimizer.ts';
import { calculateDriverScorecard, type DriverMetrics } from './driverScoring.ts';

test('GPS Protocol Parser handles Teltonika, GT06, Queclink and NMEA packets', () => {
  // Test Teltonika parsing
  const teltonikaHex = '00000000000000300801000001859b20b220000350d24c00f576b80012005a0c44';
  const teltonikaResult = parseGpsPacket(teltonikaHex, 'teltonika');
  assert.equal(teltonikaResult.protocol, 'Teltonika Codec 8/8E');
  assert.equal(teltonikaResult.validFix, true);
  assert.ok(teltonikaResult.latitude > 0);
  assert.ok(teltonikaResult.longitude > 0);

  // Test Queclink ASCII parsing
  const queclinkAscii = '+RESP:GTFRI,1A0102,860129031948572,GL300,0,1,1,4.3,62,185,34.2,55.2708,25.2048,20261016093000,424,03,0a12,1234,00,100,1420.5$';
  const queclinkResult = parseGpsPacket(queclinkAscii);
  assert.equal(queclinkResult.protocol, 'Queclink @ACK (ASCII)');
  assert.equal(queclinkResult.imei, '860129031948572');
  assert.equal(queclinkResult.speedKmh, 62);
  assert.equal(queclinkResult.latitude, 25.2048);
  assert.equal(queclinkResult.longitude, 55.2708);

  // Test NMEA parsing
  const nmeaSentence = '$GPRMC,083559.00,A,2512.4500,N,05516.3200,E,32.4,140.0,161026,,,A*64';
  const nmeaResult = parseGpsPacket(nmeaSentence);
  assert.ok(nmeaResult.protocol.includes('NMEA'));
  assert.ok(nmeaResult.latitude > 25);
  assert.ok(nmeaResult.longitude > 55);
  assert.equal(nmeaResult.speedKmh, 60); // 32.4 knots * 1.852 = ~60 km/h

  // Verify market trends device list
  assert.ok(GPS_DEVICE_MARKET_TRENDS.length >= 6);
  assert.equal(GPS_DEVICE_MARKET_TRENDS[0].id, 'teltonika-fmc130');
  assert.equal(GPS_DEVICE_MARKET_TRENDS[0].marketRank, 1);
  assert.equal(GPS_DEVICE_MARKET_TRENDS[0].compliance.uaeSira, true);
  assert.equal(GPS_DEVICE_MARKET_TRENDS[0].compliance.ksaWasl, true);
});

test('Haversine distance calculation and Route Optimization logic', () => {
  // Distance between Dubai Mall (25.1972, 55.2744) and Jebel Ali Port (25.0112, 55.0617) ~ 30-40km
  const dist = haversineDistanceKm(25.1972, 55.2744, 25.0112, 55.0617);
  assert.ok(dist > 25 && dist < 45, `Distance was ${dist}`);

  // Test route optimizer with 4 stops in Dubai
  const testStops: RouteWaypoint[] = [
    {
      id: 'depot',
      name: 'Al Quoz Central Logistics Hub',
      address: 'Al Quoz 3, Dubai',
      latitude: 25.1432,
      longitude: 55.2341,
      type: 'depot',
      timeWindowStart: '08:00',
      timeWindowEnd: '18:00',
      demandKg: 0,
      serviceTimeMin: 15,
      status: 'pending'
    },
    {
      id: 'stop-1',
      name: 'JAFZA Freezone North Gate',
      address: 'Jebel Ali, Dubai',
      latitude: 25.0150,
      longitude: 55.0890,
      type: 'delivery',
      timeWindowStart: '09:00',
      timeWindowEnd: '12:00',
      demandKg: 450,
      serviceTimeMin: 20,
      status: 'pending'
    },
    {
      id: 'stop-2',
      name: 'Business Bay Prime Tower',
      address: 'Business Bay, Dubai',
      latitude: 25.1850,
      longitude: 55.2680,
      type: 'delivery',
      timeWindowStart: '09:30',
      timeWindowEnd: '13:00',
      demandKg: 200,
      serviceTimeMin: 15,
      status: 'pending'
    },
    {
      id: 'stop-3',
      name: 'Dubai Marina Mall Dock',
      address: 'Dubai Marina, Dubai',
      latitude: 25.0770,
      longitude: 55.1400,
      type: 'delivery',
      timeWindowStart: '10:00',
      timeWindowEnd: '14:00',
      demandKg: 350,
      serviceTimeMin: 25,
      status: 'pending'
    }
  ];

  const result = optimizeRoute(testStops, '08:00', true);
  assert.ok(result.optimizedDistanceKm > 0);
  assert.ok(result.legs.length === 3);
  assert.equal(result.optimizedOrder[0].id, 'depot');
  assert.ok(result.fuelCostSavedAed >= 0);
  assert.ok(result.fuelCostSavedSar >= 0);
});

test('Driver performance scorecard computes tiers and deductions correctly', () => {
  const masterDriver: DriverMetrics = {
    driverId: 'drv-01',
    name: 'Tariq Al-Mansoor',
    avatarUrl: '',
    assignedVehicle: 'TRK-704',
    licenseNumber: 'DXB-984210',
    contactNumber: '+971 50 123 4567',
    yearsExperience: 12,
    totalDistanceKm: 4200,
    totalDriveHours: 110,
    harshBrakingCount: 1,
    harshAccelerationCount: 1,
    harshCorneringCount: 0,
    excessiveIdlingHours: 2.5,
    speedingIncidentsCount: 0,
    dmsDistractionAlerts: 0,
    seatbeltViolations: 0,
    fuelConsumedLiters: 1150,
    idleFuelWastedLiters: 7.5
  };

  const masterResult = calculateDriverScorecard(masterDriver);
  assert.ok(masterResult.overallScore >= 88);
  assert.equal(masterResult.safetyTier, 'Master Driver');

  const riskyDriver: DriverMetrics = {
    driverId: 'drv-02',
    name: 'At-Risk Test Driver',
    avatarUrl: '',
    assignedVehicle: 'VAN-102',
    licenseNumber: 'DXB-112233',
    contactNumber: '+971 55 999 8888',
    yearsExperience: 2,
    totalDistanceKm: 1800,
    totalDriveHours: 65,
    harshBrakingCount: 14,
    harshAccelerationCount: 12,
    harshCorneringCount: 8,
    excessiveIdlingHours: 18.0,
    speedingIncidentsCount: 7,
    dmsDistractionAlerts: 6,
    seatbeltViolations: 3,
    fuelConsumedLiters: 680,
    idleFuelWastedLiters: 54.0
  };

  const riskyResult = calculateDriverScorecard(riskyDriver);
  assert.ok(riskyResult.overallScore < 70);
  assert.equal(riskyResult.safetyTier, 'High Risk');
});
