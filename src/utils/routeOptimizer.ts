/**
 * GWTrax Automated Route Optimization Engine
 * Calculates optimal TSP waypoint sequences, travel times, fuel burn, and financial savings.
 */

export interface RouteWaypoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'depot' | 'delivery' | 'pickup';
  timeWindowStart: string; // e.g. "08:00"
  timeWindowEnd: string;   // e.g. "11:30"
  demandKg: number;
  serviceTimeMin: number;
  contactPerson?: string;
  phone?: string;
  notes?: string;
  status: 'pending' | 'in_transit' | 'completed' | 'delayed';
  eta?: string;
}

export interface RouteOptimizationResult {
  originalOrder: RouteWaypoint[];
  optimizedOrder: RouteWaypoint[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  distanceSavedKm: number;
  percentageDistanceSaved: number;
  originalDurationMin: number;
  optimizedDurationMin: number;
  timeSavedMin: number;
  fuelSavedLiters: number;
  fuelCostSavedAed: number; // UAE Dirhams (approx 3.03 AED/L)
  fuelCostSavedSar: number; // Saudi Riyals (approx 2.33 SAR/L)
  fuelCostSavedUsd: number; // USD
  co2SavedKg: number;       // approx 2.68 kg CO2 per liter diesel
  legs: RouteLeg[];
}

export interface RouteLeg {
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMin: number;
  cumulativeDistanceKm: number;
  eta: string;
}

// Diesel parameters
const DIESEL_CONSUMPTION_L_PER_100KM = 28.5; // Loaded commercial truck average
const CO2_KG_PER_LITER = 2.68;
const DIESEL_PRICE_AED_PER_L = 3.05;
const DIESEL_PRICE_SAR_PER_L = 2.45;
const DIESEL_PRICE_USD_PER_L = 0.83;

/**
 * Calculates Haversine distance in kilometers between two coordinates
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Multiply by road circuity factor 1.28 to account for actual street network vs straight-line distance
  return Number((R * c * 1.28).toFixed(2));
}

/**
 * Total route distance for an array of waypoints
 */
export function calculateTotalRouteDistance(waypoints: RouteWaypoint[], returnToDepot = true): number {
  if (waypoints.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    total += haversineDistanceKm(
      waypoints[i].latitude,
      waypoints[i].longitude,
      waypoints[i + 1].latitude,
      waypoints[i + 1].longitude
    );
  }
  if (returnToDepot && waypoints.length > 2) {
    total += haversineDistanceKm(
      waypoints[waypoints.length - 1].latitude,
      waypoints[waypoints.length - 1].longitude,
      waypoints[0].latitude,
      waypoints[0].longitude
    );
  }
  return Number(total.toFixed(2));
}

/**
 * Solves Traveling Salesperson Problem (TSP) with Nearest Neighbor + 2-Opt refinement
 */
export function optimizeRoute(
  stops: RouteWaypoint[],
  departureTime = '08:00',
  returnToDepot = true
): RouteOptimizationResult {
  if (stops.length <= 2) {
    const dist = calculateTotalRouteDistance(stops, returnToDepot);
    return {
      originalOrder: [...stops],
      optimizedOrder: [...stops],
      originalDistanceKm: dist,
      optimizedDistanceKm: dist,
      distanceSavedKm: 0,
      percentageDistanceSaved: 0,
      originalDurationMin: Math.round(dist * 1.6),
      optimizedDurationMin: Math.round(dist * 1.6),
      timeSavedMin: 0,
      fuelSavedLiters: 0,
      fuelCostSavedAed: 0,
      fuelCostSavedSar: 0,
      fuelCostSavedUsd: 0,
      co2SavedKg: 0,
      legs: []
    };
  }

  const originalDistance = calculateTotalRouteDistance(stops, returnToDepot);

  // Keep depot as start (index 0)
  const depot = stops[0];
  const unvisited = stops.slice(1);
  const orderedStops: RouteWaypoint[] = [depot];

  let current = depot;
  while (unvisited.length > 0) {
    let bestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistanceKm(current.latitude, current.longitude, unvisited[i].latitude, unvisited[i].longitude);
      if (d < minDistance) {
        minDistance = d;
        bestIndex = i;
      }
    }

    const nextStop = unvisited.splice(bestIndex, 1)[0];
    orderedStops.push(nextStop);
    current = nextStop;
  }

  // 2-Opt local search improvement on ordered stops (excluding depot at index 0)
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 1; i < orderedStops.length - 1; i++) {
      for (let k = i + 1; k < orderedStops.length; k++) {
        // Evaluate swap
        const dCurrent =
          haversineDistanceKm(orderedStops[i - 1].latitude, orderedStops[i - 1].longitude, orderedStops[i].latitude, orderedStops[i].longitude) +
          (k + 1 < orderedStops.length
            ? haversineDistanceKm(orderedStops[k].latitude, orderedStops[k].longitude, orderedStops[k + 1].latitude, orderedStops[k + 1].longitude)
            : returnToDepot
            ? haversineDistanceKm(orderedStops[k].latitude, orderedStops[k].longitude, orderedStops[0].latitude, orderedStops[0].longitude)
            : 0);

        const dReversed =
          haversineDistanceKm(orderedStops[i - 1].latitude, orderedStops[i - 1].longitude, orderedStops[k].latitude, orderedStops[k].longitude) +
          (k + 1 < orderedStops.length
            ? haversineDistanceKm(orderedStops[i].latitude, orderedStops[i].longitude, orderedStops[k + 1].latitude, orderedStops[k + 1].longitude)
            : returnToDepot
            ? haversineDistanceKm(orderedStops[i].latitude, orderedStops[i].longitude, orderedStops[0].latitude, orderedStops[0].longitude)
            : 0);

        if (dReversed < dCurrent - 0.05) {
          // Reverse segment between i and k
          const segment = orderedStops.slice(i, k + 1).reverse();
          orderedStops.splice(i, segment.length, ...segment);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  const optimizedDistance = calculateTotalRouteDistance(orderedStops, returnToDepot);
  const rawSaved = Math.max(0, originalDistance - optimizedDistance);
  const distanceSaved = Number(rawSaved.toFixed(2));
  const percentageSaved = originalDistance > 0 ? Number(((distanceSaved / originalDistance) * 100).toFixed(1)) : 0;

  // Average commercial vehicle speed in Middle East metro corridor (Dubai / Riyadh) ~ 42 km/h
  const originalDurationMin = Math.round((originalDistance / 42) * 60 + stops.length * 15);
  const optimizedDurationMin = Math.round((optimizedDistance / 42) * 60 + stops.length * 15);
  const timeSavedMin = Math.max(0, originalDurationMin - optimizedDurationMin);

  // Fuel calculation
  const fuelSavedLiters = Number(((distanceSaved * DIESEL_CONSUMPTION_L_PER_100KM) / 100).toFixed(2));
  const fuelCostSavedAed = Number((fuelSavedLiters * DIESEL_PRICE_AED_PER_L).toFixed(2));
  const fuelCostSavedSar = Number((fuelSavedLiters * DIESEL_PRICE_SAR_PER_L).toFixed(2));
  const fuelCostSavedUsd = Number((fuelSavedLiters * DIESEL_PRICE_USD_PER_L).toFixed(2));
  const co2SavedKg = Number((fuelSavedLiters * CO2_KG_PER_LITER).toFixed(2));

  // Build legs and ETAs
  const legs: RouteLeg[] = [];
  let cumDistance = 0;
  let [currHour, currMin] = departureTime.split(':').map(Number);
  if (isNaN(currHour)) currHour = 8;
  if (isNaN(currMin)) currMin = 0;

  const enrichedStops = orderedStops.map((stop, idx) => {
    if (idx === 0) {
      return { ...stop, eta: departureTime };
    }
    const prev = orderedStops[idx - 1];
    const legDist = haversineDistanceKm(prev.latitude, prev.longitude, stop.latitude, stop.longitude);
    cumDistance += legDist;
    const travelMin = Math.round((legDist / 42) * 60);

    currMin += travelMin + prev.serviceTimeMin;
    while (currMin >= 60) {
      currHour = (currHour + 1) % 24;
      currMin -= 60;
    }

    const etaStr = `${String(currHour).padStart(2, '0')}:${String(currMin).padStart(2, '0')}`;

    legs.push({
      fromName: prev.name,
      toName: stop.name,
      distanceKm: legDist,
      durationMin: travelMin,
      cumulativeDistanceKm: Number(cumDistance.toFixed(2)),
      eta: etaStr
    });

    return { ...stop, eta: etaStr };
  });

  return {
    originalOrder: [...stops],
    optimizedOrder: enrichedStops,
    originalDistanceKm: originalDistance,
    optimizedDistanceKm: optimizedDistance,
    distanceSavedKm: distanceSaved,
    percentageDistanceSaved: percentageSaved,
    originalDurationMin,
    optimizedDurationMin,
    timeSavedMin,
    fuelSavedLiters,
    fuelCostSavedAed,
    fuelCostSavedSar,
    fuelCostSavedUsd,
    co2SavedKg,
    legs
  };
}
