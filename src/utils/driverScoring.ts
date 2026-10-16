/**
 * GWTrax Driver Performance & Safety Telematics Engine
 * Computes safety scores, eco-driving index, harsh driving penalties, and coaching recommendations.
 */

export interface DriverMetrics {
  driverId: string;
  name: string;
  avatarUrl: string;
  assignedVehicle: string;
  licenseNumber: string;
  contactNumber: string;
  yearsExperience: number;
  totalDistanceKm: number;
  totalDriveHours: number;
  harshBrakingCount: number;
  harshAccelerationCount: number;
  harshCorneringCount: number;
  excessiveIdlingHours: number;
  speedingIncidentsCount: number;
  dmsDistractionAlerts: number; // Driver Monitoring System (phone usage, fatigue, yawning)
  seatbeltViolations: number;
  fuelConsumedLiters: number;
  idleFuelWastedLiters: number;
}

export interface DriverScorecardResult {
  overallScore: number; // 0 to 100
  safetyTier: 'Master Driver' | 'Safe Driver' | 'Needs Coaching' | 'High Risk';
  safetyScore: number;
  ecoScore: number;
  complianceScore: number;
  harshPenaltyTotal: number;
  speedingPenaltyTotal: number;
  idlePenaltyTotal: number;
  dmsPenaltyTotal: number;
  fuelEfficiencyLPer100Km: number;
  fuelWasteCostAed: number;
  fuelWasteCostSar: number;
  recommendedAction: string;
}

/**
 * Computes driver safety and eco scorecard from raw telematics telemetry
 */
export function calculateDriverScorecard(metrics: DriverMetrics): DriverScorecardResult {
  // Base score 100
  let safetyScore = 100;
  let ecoScore = 100;
  let complianceScore = 100;

  // Penalties per 100 km normalized or absolute
  const harshBrakingPenalty = metrics.harshBrakingCount * 3.5;
  const harshAccelPenalty = metrics.harshAccelerationCount * 2.5;
  const harshCornerPenalty = metrics.harshCorneringCount * 2.0;
  const harshPenaltyTotal = harshBrakingPenalty + harshAccelPenalty + harshCornerPenalty;

  const speedingPenaltyTotal = metrics.speedingIncidentsCount * 4.0;
  const idlePenaltyTotal = metrics.excessiveIdlingHours * 3.0;
  const dmsPenaltyTotal = metrics.dmsDistractionAlerts * 5.0;
  const seatbeltPenalty = metrics.seatbeltViolations * 6.0;

  safetyScore = Math.max(10, Math.round(100 - (harshPenaltyTotal + speedingPenaltyTotal * 0.7 + dmsPenaltyTotal * 0.8)));
  ecoScore = Math.max(15, Math.round(100 - (idlePenaltyTotal * 1.5 + harshAccelPenalty * 1.2 + (metrics.idleFuelWastedLiters / 5))));
  complianceScore = Math.max(10, Math.round(100 - (speedingPenaltyTotal + seatbeltPenalty + dmsPenaltyTotal * 0.5)));

  // Weighted overall: 50% safety, 30% eco, 20% compliance
  const overallScore = Math.round(safetyScore * 0.5 + ecoScore * 0.3 + complianceScore * 0.2);

  let safetyTier: DriverScorecardResult['safetyTier'] = 'High Risk';
  let recommendedAction = 'Immediate safety stand-down and road retraining required.';

  if (overallScore >= 90) {
    safetyTier = 'Master Driver';
    recommendedAction = 'Eligible for quarterly driver safety bonus and mentor recognition.';
  } else if (overallScore >= 80) {
    safetyTier = 'Safe Driver';
    recommendedAction = 'Minor feedback on progressive braking and reducing midday AC idle.';
  } else if (overallScore >= 70) {
    safetyTier = 'Needs Coaching';
    recommendedAction = 'Schedule 1-on-1 telematics debrief focusing on speed limits and following distance.';
  }

  const fuelEfficiencyLPer100Km =
    metrics.totalDistanceKm > 0
      ? Number(((metrics.fuelConsumedLiters / metrics.totalDistanceKm) * 100).toFixed(1))
      : 28.0;

  const fuelWasteCostAed = Number((metrics.idleFuelWastedLiters * 3.05).toFixed(2));
  const fuelWasteCostSar = Number((metrics.idleFuelWastedLiters * 2.45).toFixed(2));

  return {
    overallScore,
    safetyTier,
    safetyScore,
    ecoScore,
    complianceScore,
    harshPenaltyTotal: Number(harshPenaltyTotal.toFixed(1)),
    speedingPenaltyTotal,
    idlePenaltyTotal: Number(idlePenaltyTotal.toFixed(1)),
    dmsPenaltyTotal,
    fuelEfficiencyLPer100Km,
    fuelWasteCostAed,
    fuelWasteCostSar,
    recommendedAction
  };
}
