import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  Fuel, 
  Clock, 
  Eye, 
  UserCheck, 
  PhoneCall, 
  MessageSquare, 
  CheckCircle2, 
  Camera, 
  Activity,
  DollarSign
} from 'lucide-react';
import { DriverMetrics, calculateDriverScorecard, DriverScorecardResult } from '../utils/driverScoring.ts';

interface DriverPerformanceViewProps {
  drivers: DriverMetrics[];
}

export const DriverPerformanceView: React.FC<DriverPerformanceViewProps> = ({ drivers }) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(drivers[0]?.driverId || '');
  const [coachingNoticeSent, setCoachingNoticeSent] = useState<string | null>(null);

  // Compute scorecard for all drivers and sort by overall score descending
  const evaluatedDrivers = React.useMemo(() => {
    return drivers
      .map((driver) => ({
        driver,
        scorecard: calculateDriverScorecard(driver)
      }))
      .sort((a, b) => b.scorecard.overallScore - a.scorecard.overallScore);
  }, [drivers]);

  const selectedEvaluation = evaluatedDrivers.find((ed) => ed.driver.driverId === selectedDriverId) || evaluatedDrivers[0];

  const handleSendCoaching = (driver: DriverMetrics, scorecard: DriverScorecardResult) => {
    setCoachingNoticeSent(
      `Safety coaching advisory sent via SMS/App to ${driver.name} (${driver.contactNumber}): "${scorecard.recommendedAction}"`
    );
    setTimeout(() => setCoachingNoticeSent(null), 5000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Telematics Safety &amp; Behavior Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Driver Performance &amp; Safety Scorecards
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time scoring based on OBD-II / CAN-bus G-sensors, harsh maneuvers, idling fuel burn, and AI DMS camera telemetry.
          </p>
        </div>

        {/* Global Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono">
            <span className="text-slate-400">Fleet Average Score: </span>
            <span className="text-emerald-400 font-bold text-sm">
              {Math.round(
                evaluatedDrivers.reduce((acc, curr) => acc + curr.scorecard.overallScore, 0) /
                  (evaluatedDrivers.length || 1)
              )}
              /100
            </span>
          </div>
        </div>
      </div>

      {coachingNoticeSent && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{coachingNoticeSent}</span>
        </div>
      )}

      {/* Main Grid: Leaderboard & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Driver Leaderboard & Telematics Matrix */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Safety Leaderboard &amp; Incident Audit</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Ranked by 30-Day Index</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rank &amp; Driver</th>
                  <th className="py-3 px-3">Safety Score</th>
                  <th className="py-3 px-3">Harsh Braking</th>
                  <th className="py-3 px-3">Rapid Accel</th>
                  <th className="py-3 px-3">Idle Hours</th>
                  <th className="py-3 px-3">DMS Alerts</th>
                  <th className="py-3 px-4 text-right">Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {evaluatedDrivers.map(({ driver, scorecard }, index) => {
                  const isSelected = driver.driverId === selectedDriverId;
                  return (
                    <tr
                      key={driver.driverId}
                      onClick={() => setSelectedDriverId(driver.driverId)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-800/90' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-400 text-xs w-4">
                            #{index + 1}
                          </span>
                          <img
                            src={driver.avatarUrl}
                            alt={driver.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-semibold text-white">{driver.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{driver.assignedVehicle}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-mono text-sm font-bold text-white">
                          <span
                            className={
                              scorecard.overallScore >= 90
                                ? 'text-emerald-400'
                                : scorecard.overallScore >= 80
                                ? 'text-sky-400'
                                : scorecard.overallScore >= 70
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }
                          >
                            {scorecard.overallScore}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        {driver.harshBrakingCount > 4 ? (
                          <span className="text-rose-400 font-bold">{driver.harshBrakingCount}</span>
                        ) : (
                          driver.harshBrakingCount
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        {driver.harshAccelerationCount}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        {driver.excessiveIdlingHours}h
                      </td>

                      <td className="py-3.5 px-3 font-mono">
                        {driver.dmsDistractionAlerts > 0 ? (
                          <span className="text-amber-400 font-semibold">{driver.dmsDistractionAlerts}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                            scorecard.safetyTier === 'Master Driver'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : scorecard.safetyTier === 'Safe Driver'
                              ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                              : scorecard.safetyTier === 'Needs Coaching'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                          }`}
                        >
                          {scorecard.safetyTier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Selected Driver Comprehensive Scorecard */}
        {selectedEvaluation && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5">
            {/* Driver Profile Header */}
            <div className="flex items-center gap-4">
              <img
                src={selectedEvaluation.driver.avatarUrl}
                alt={selectedEvaluation.driver.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    selectedEvaluation.scorecard.safetyTier === 'Master Driver'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {selectedEvaluation.scorecard.safetyTier}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedEvaluation.driver.name}
                </h3>
                <div className="text-xs text-slate-400 font-mono">
                  Lic: {selectedEvaluation.driver.licenseNumber}
                </div>
              </div>
            </div>

            {/* Overall Score Dial */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Composite Safety Index</div>
                <div className="mt-1 font-mono text-3xl font-bold text-white">
                  {selectedEvaluation.scorecard.overallScore}
                  <span className="text-sm font-normal text-slate-400"> / 100</span>
                </div>
              </div>

              <div className="space-y-1 text-right text-xs font-mono">
                <div>Safety: <span className="text-emerald-400 font-bold">{selectedEvaluation.scorecard.safetyScore}</span></div>
                <div>Eco: <span className="text-sky-400 font-bold">{selectedEvaluation.scorecard.ecoScore}</span></div>
                <div>Compliance: <span className="text-indigo-400 font-bold">{selectedEvaluation.scorecard.complianceScore}</span></div>
              </div>
            </div>

            {/* Financial Impact of Behavior (Fuel Waste Audit) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>Idle Fuel Waste Audit</span>
                </span>
                <span className="font-mono text-amber-400 text-xs">
                  {selectedEvaluation.driver.idleFuelWastedLiters} Liters
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Excessive vehicle idling in heat wasted approx{' '}
                <strong className="text-white font-mono">AED {selectedEvaluation.scorecard.fuelWasteCostAed}</strong> /{' '}
                <strong className="text-white font-mono">SAR {selectedEvaluation.scorecard.fuelWasteCostSar}</strong> in fuel this month.
              </div>
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Fuel Economy:</span>
                <span className="font-bold text-emerald-400">
                  {selectedEvaluation.scorecard.fuelEfficiencyLPer100Km} L/100km
                </span>
              </div>
            </div>

            {/* AI Coaching Recommendation Box */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Automated Telematics Coaching</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedEvaluation.scorecard.recommendedAction}
              </p>
            </div>

            {/* Action Button: Dispatch Coaching Note */}
            <button
              onClick={() => handleSendCoaching(selectedEvaluation.driver, selectedEvaluation.scorecard)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors border border-slate-700"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Send Telematics Debrief to Driver</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
