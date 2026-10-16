import React from 'react';
import { 
  Navigation, 
  Route, 
  ShieldAlert, 
  Cpu, 
  MapPin, 
  Play, 
  Pause, 
  Zap, 
  Radio
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'routes' | 'drivers' | 'devices' | 'alerts';
  setActiveTab: (tab: 'map' | 'routes' | 'drivers' | 'devices' | 'alerts') => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  unacknowledgedAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSimulating,
  setIsSimulating,
  simulationSpeed,
  setSimulationSpeed,
  unacknowledgedAlertsCount
}) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single Brand wordmark element with subtle subtitle */}
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="#map" 
          onClick={(e) => { e.preventDefault(); setActiveTab('map'); }}
          className="flex items-center gap-2.5 text-slate-100 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>GWTrax</span>
              <span className="text-xs font-normal text-emerald-400 tracking-normal font-mono">v3.2</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Track Smart. Move Better
            </div>
          </div>
        </a>
      </div>

      {/* Zone 2: Clean 5-link text navigation */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-1.5 py-1 whitespace-nowrap transition-colors relative ${
            activeTab === 'map' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Live Fleet Map</span>
          {activeTab === 'map' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-1.5 py-1 whitespace-nowrap transition-colors relative ${
            activeTab === 'routes' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Route Optimizer</span>
          {activeTab === 'routes' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-1.5 py-1 whitespace-nowrap transition-colors relative ${
            activeTab === 'drivers' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Driver Performance</span>
          {activeTab === 'drivers' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-1.5 py-1 whitespace-nowrap transition-colors relative ${
            activeTab === 'devices' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>GPS Devices &amp; Advisor</span>
          {activeTab === 'devices' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-1.5 py-1 whitespace-nowrap transition-colors relative ${
            activeTab === 'alerts' ? 'text-emerald-400 font-semibold' : 'text-slate-300 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Geofences &amp; Alerts</span>
          {unacknowledgedAlertsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
              {unacknowledgedAlertsCount}
            </span>
          )}
          {activeTab === 'alerts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Live Telemetry Simulation & Status) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Simulation toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-all ${
              isSimulating
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle live GPS driving simulation"
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono">Live Sim ON</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Simulate GPS</span>
              </>
            )}
          </button>

          {isSimulating && (
            <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 font-mono text-[11px]">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  className={`px-1.5 py-0.5 rounded ${
                    simulationSpeed === speed
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dispatch Route shortcut button */}
        <button
          onClick={() => setActiveTab('routes')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-emerald-500/10"
        >
          <Route className="w-3.5 h-3.5" />
          <span>Optimize Route</span>
        </button>
      </div>
    </header>
  );
};
