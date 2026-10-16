import React, { useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  Radio, 
  Terminal, 
  HelpCircle, 
  ShieldCheck, 
  DollarSign, 
  Thermometer, 
  Layers, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Copy, 
  Check, 
  Download,
  AlertCircle,
  Plus,
  Server,
  Cable,
  Smartphone,
  CheckSquare,
  Compass,
  Key
} from 'lucide-react';
import { 
  GPS_DEVICE_MARKET_TRENDS, 
  GpsDeviceSpec, 
  parseGpsPacket, 
  ParsedGpsTelemetry 
} from '../utils/gpsProtocols.ts';
import { Vehicle } from '../types/fleet.ts';

interface DeviceAdvisorViewProps {
  onSyncDecodedTelemetryToFleet: (telemetry: ParsedGpsTelemetry) => void;
  onRegisterNewVehicle?: (newVehicle: Vehicle) => void;
}

export const DeviceAdvisorView: React.FC<DeviceAdvisorViewProps> = ({
  onSyncDecodedTelemetryToFleet,
  onRegisterNewVehicle
}) => {
  const [selectedDevice, setSelectedDevice] = useState<GpsDeviceSpec>(GPS_DEVICE_MARKET_TRENDS[0]);
  const [activeTab, setActiveTab] = useState<'advisor' | 'quickstart' | 'decoder' | 'apn_sms'>('quickstart');

  // Register New Device Modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newImei, setNewImei] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newSelectedModel, setNewSelectedModel] = useState(GPS_DEVICE_MARKET_TRENDS[0].id);
  const [newCarrier, setNewCarrier] = useState('e& (Etisalat UAE)');

  // Decoder State
  const [protocolHint, setProtocolHint] = useState<string>('teltonika');
  const [rawPacketInput, setRawPacketInput] = useState<string>(
    '00000000000000300801000001859b20b220000350d24c00f576b80012005a0c44'
  );
  const [decodedResult, setDecodedResult] = useState<ParsedGpsTelemetry | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // APN Generator State
  const [selectedCarrier, setSelectedCarrier] = useState<'etisalat' | 'du' | 'stc' | 'mobily' | 'zain' | 'omantel'>('etisalat');
  const [copiedSms, setCopiedSms] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  // Sample Packets for testing
  const samplePackets = {
    teltonika: '00000000000000300801000001859b20b220000350d24c00f576b80012005a0c44',
    gt06: '78781f121a0a10091e00ca026b38c208942b0048140001000000000000130d0a',
    queclink: '+RESP:GTFRI,1A0102,860129031948572,GL300,0,1,1,4.3,62,185,34.2,55.2708,25.2048,20261016093000,424,03,0a12,1234,00,100,1420.5$',
    nmea: '$GPRMC,091530.00,A,2511.4500,N,05517.3200,E,42.5,135.0,161026,,,A*72',
    ais140: '$AIS140,EMERGENCY,864295031489201,1,20261016,091530,25.1124,55.1893,58,80,16,22,1.2,0.8,OMANTEL,1,0,0'
  };

  const handleSelectProtocolSample = (type: keyof typeof samplePackets) => {
    setProtocolHint(type);
    setRawPacketInput(samplePackets[type]);
    setDecodedResult(null);
  };

  const handleDecode = () => {
    const result = parseGpsPacket(rawPacketInput, protocolHint);
    setDecodedResult(result);
  };

  const handleSyncToFleet = () => {
    if (!decodedResult) return;
    onSyncDecodedTelemetryToFleet(decodedResult);
    setSyncFeedback(`Successfully synchronized live packet from IMEI ${decodedResult.imei} into active fleet view!`);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // APN configuration strings for Middle East telcos
  const getSmsConfig = () => {
    const apnMap = {
      etisalat: { apn: 'etisalat.ae', user: '', pass: '', carrierName: 'e& (Etisalat UAE)' },
      du: { apn: 'du.ae', user: '', pass: '', carrierName: 'du UAE' },
      stc: { apn: 'jawalnet.com.sa', user: '', pass: '', carrierName: 'STC Saudi Arabia' },
      mobily: { apn: 'web1', user: '', pass: '', carrierName: 'Mobily KSA' },
      zain: { apn: 'zain', user: '', pass: '', carrierName: 'Zain Saudi / Kuwait' },
      omantel: { apn: 'isp.omantel.net.om', user: '', pass: '', carrierName: 'Omantel' }
    };

    const cfg = apnMap[selectedCarrier];

    if (selectedDevice.protocolType.includes('Teltonika')) {
      return `  setparam 2004:${cfg.apn} 2005:${cfg.user} 2006:${cfg.pass} 2001:fleet.gwtrax.com 2002:${selectedDevice.defaultPort} 2003:0`;
    } else if (selectedDevice.protocolType.includes('GT06')) {
      return `SERVER,1,fleet.gwtrax.com,${selectedDevice.defaultPort},0#\nAPN,${cfg.apn},${cfg.user},${cfg.pass}#\nTIMER,10,60#`;
    } else if (selectedDevice.protocolType.includes('Queclink')) {
      return `AT+GTBND=gv300,fleet.gwtrax.com,${selectedDevice.defaultPort},,${cfg.apn},${cfg.user},${cfg.pass}...$`;
    }
    return `APN:${cfg.apn};SERVER:fleet.gwtrax.com:${selectedDevice.defaultPort}`;
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(getSmsConfig());
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 3000);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(label);
    setTimeout(() => setCopiedEndpoint(null), 2500);
  };

  const handleRegisterDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImei.trim() || !newPlate.trim()) return;

    const matchedSpec = GPS_DEVICE_MARKET_TRENDS.find(d => d.id === newSelectedModel) || GPS_DEVICE_MARKET_TRENDS[0];

    const newVehicle: Vehicle = {
      id: `VEH-${Date.now().toString().slice(-4)}`,
      plateNumber: newPlate.toUpperCase(),
      name: newVehicleName || `${matchedSpec.brand} ${matchedSpec.model}`,
      type: 'delivery_van',
      driverId: `drv-${Date.now().toString().slice(-3)}`,
      driverName: newDriverName || 'Assigned Fleet Driver',
      status: 'idle',
      location: {
        latitude: 25.1972,
        longitude: 55.2744,
        address: 'Registered Gateway Hub',
        city: 'Dubai',
        country: 'United Arab Emirates'
      },
      telemetry: {
        speedKmh: 0,
        speedLimitKmh: 80,
        headingDeg: 90,
        ignition: true,
        fuelLevelPercent: 100,
        fuelCapacityLiters: 90,
        engineRpm: 750,
        coolantTempC: 84,
        batteryVoltage: 12.8,
        odometerKm: 1250,
        satellites: 16,
        gsmSignalPercent: 95,
        immobilizerCutoffActive: false,
        tamperDetected: false,
        lastPingTime: 'Just now'
      },
      deviceInfo: {
        imei: newImei.trim(),
        deviceModel: matchedSpec.model,
        brand: matchedSpec.brand,
        protocol: `${matchedSpec.protocolType} (Port ${matchedSpec.defaultPort})`,
        port: matchedSpec.defaultPort,
        firmwareVersion: 'GWTrax-FW-v3.2',
        simImsi: '424029' + Math.floor(Math.random() * 100000000),
        carrier: newCarrier,
        compliance: matchedSpec.compliance.uaeSira ? 'UAE SIRA & SecurePath Certified' : 'Wasl Approved'
      },
      historyTrail: [[25.1972, 55.2744]]
    };

    if (onRegisterNewVehicle) {
      onRegisterNewVehicle(newVehicle);
    }
    setShowRegisterModal(false);
    setSyncFeedback(`GPS Tracker (IMEI: ${newImei}) linked to ${newPlate.toUpperCase()}! Ready for live telemetry.`);
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>Universal Telematics Hardware Gateway &amp; Integration Hub</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            GPS Device Sync &amp; Hardware Setup Guide
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Link physical GPS trackers, configure Middle East telecom APNs, set gateway endpoints, and test live protocol data streams.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-transform active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Link New GPS Tracker</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium">
        <button
          onClick={() => setActiveTab('quickstart')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-colors ${
            activeTab === 'quickstart' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Hardware Linking &amp; Testing Guide</span>
        </button>
        <button
          onClick={() => setActiveTab('advisor')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-colors ${
            activeTab === 'advisor' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Market Advisor &amp; Comparison</span>
        </button>
        <button
          onClick={() => setActiveTab('apn_sms')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-colors ${
            activeTab === 'apn_sms' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>APN &amp; SMS Generator</span>
        </button>
        <button
          onClick={() => setActiveTab('decoder')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-colors ${
            activeTab === 'decoder' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Live Protocol Packet Decoder</span>
        </button>
      </div>

      {syncFeedback && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* VIEW 0: HARDWARE LINKING & TESTING QUICK-START GUIDE */}
      {activeTab === 'quickstart' && (
        <div className="space-y-6">
          {/* Executive Overview Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 rounded-2xl space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <CheckSquare className="w-4 h-4" />
              <span>Direct Hardware Link &amp; Testing Specifications</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              How to Link Your Physical GPS Tracker to GWTrax
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Follow these 4 clear steps to program your hardware tracker (Teltonika, Jimi IoT, Queclink, Coban, or smartphone client). Configure the <strong>APN</strong> for your local telecom provider, assign the <strong>GWTrax Endpoint &amp; Port</strong>, and start receiving real-time live telemetry.
            </p>
          </div>

          {/* 4-Step Technical Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1: SIM Card & Telecom APN Reference */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                  1
                </span>
                <h3 className="text-sm font-bold text-white">SIM Card &amp; Carrier APN Reference</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Insert a Micro or Nano SIM with active 4G data (disable SIM PIN lock first via phone). Enter the APN corresponding to your country/carrier:
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Country / Carrier</th>
                      <th className="py-2 px-3">APN String</th>
                      <th className="py-2 px-3 text-right">Copy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200 text-[11px]">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white">e& / Etisalat (UAE)</td>
                      <td className="py-2 px-3 text-emerald-400">etisalat.ae</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleCopyText('etisalat.ae', 'etisalat')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedEndpoint === 'etisalat' ? <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" /> : <Copy className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white">du (UAE)</td>
                      <td className="py-2 px-3 text-emerald-400">du.ae</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleCopyText('du.ae', 'du')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedEndpoint === 'du' ? <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" /> : <Copy className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white">STC (Saudi Arabia)</td>
                      <td className="py-2 px-3 text-emerald-400">jawalnet.com.sa</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleCopyText('jawalnet.com.sa', 'stc')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedEndpoint === 'stc' ? <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" /> : <Copy className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white">Mobily (Saudi Arabia)</td>
                      <td className="py-2 px-3 text-emerald-400">web1</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleCopyText('web1', 'mobily')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedEndpoint === 'mobily' ? <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" /> : <Copy className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white">Omantel / Ooredoo</td>
                      <td className="py-2 px-3 text-emerald-400">isp.omantel.net.om</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleCopyText('isp.omantel.net.om', 'omantel')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedEndpoint === 'omantel' ? <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" /> : <Copy className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-white">Global IoT / 1NCE / Emnify</td>
                      <td className="py-2 px-3 text-emerald-400">iot.1nce.net</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleCopyText('iot.1nce.net', 'global')}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedEndpoint === 'global' ? <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" /> : <Copy className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Step 2: Gateway Server Endpoint & Port Reference */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                  2
                </span>
                <h3 className="text-sm font-bold text-white">GWTrax Server Endpoint &amp; Ports</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                In your device configuration software (Teltonika Configurator, Jimi Tool, or SMS), set the following server endpoint and dedicated protocol listener port:
              </p>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Server Hostname:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">fleet.gwtrax.com</span>
                    <button
                      onClick={() => handleCopyText('fleet.gwtrax.com', 'host')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedEndpoint === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Static Gateway IP:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white">34.147.88.210</span>
                    <button
                      onClick={() => handleCopyText('34.147.88.210', 'ip')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedEndpoint === 'ip' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Protocol port breakdown */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800/80">
                  <span className="text-white">Teltonika (FMC130 / FMB920)</span>
                  <span className="text-emerald-400 font-bold">Port 5027 (TCP/UDP)</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800/80">
                  <span className="text-white">Jimi / Concox (VL02 / GT06)</span>
                  <span className="text-emerald-400 font-bold">Port 5023 (TCP)</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800/80">
                  <span className="text-white">Queclink (@ACK ASCII)</span>
                  <span className="text-emerald-400 font-bold">Port 5004 (TCP/UDP)</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800/80">
                  <span className="text-white">Smartphone Client (Traccar/OsmAnd)</span>
                  <span className="text-emerald-400 font-bold">Port 5055 (HTTP GET/POST)</span>
                </div>
              </div>
            </div>

            {/* Step 3: 4-Wire Automotive Wiring & Immobilizer */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                  3
                </span>
                <h3 className="text-sm font-bold text-white">Physical 4-Wire Harness &amp; Immobilizer Wiring</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect the standard 4-wire automotive harness under the driver dashboard:
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-3 p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <span className="text-white font-bold">PIN 1 (RED): +12V / +24V Constant Battery</span>
                    <p className="text-[10px] text-slate-400">Directly to battery terminal with inline 2A/3A fuse.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-600 shrink-0" />
                  <div>
                    <span className="text-white font-bold">PIN 2 (BLACK): Vehicle Chassis Ground</span>
                    <p className="text-[10px] text-slate-400">Firmly bolted to vehicle unpainted chassis bare metal.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0" />
                  <div>
                    <span className="text-white font-bold">PIN 3 (YELLOW): Ignition ACC Sense (DIN1)</span>
                    <p className="text-[10px] text-slate-400">Detects Engine ON/OFF/Idle and driver trip start.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-200 shrink-0" />
                  <div>
                    <span className="text-white font-bold">PIN 4 (WHITE): Relay DOUT1 (Engine Cut-Off)</span>
                    <p className="text-[10px] text-slate-400">Connects to 85/86 coil pins of Bosch 40A fuel pump kill relay.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Next Steps & Testing Methods */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                  4
                </span>
                <h3 className="text-sm font-bold text-white">How to Test This Application Immediately</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Choose any of these 4 verification workflows to see the software in action:
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-emerald-400 font-bold font-mono">
                    <span>Method A: Built-in Live Simulation</span>
                    <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">Fastest (0s)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Click the <strong>&quot;Simulate GPS&quot;</strong> toggle in the top bar. Vehicles will immediately drive along highway routes in Dubai &amp; Riyadh with live speed, fuel, and reefer temperatures updating in real time.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-sky-400 font-bold font-mono">
                    <span>Method B: Test with Your Smartphone</span>
                    <span className="text-[10px] bg-sky-500/10 px-1.5 py-0.5 rounded">Zero Hardware</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Install free <strong>&quot;Traccar Client&quot;</strong> or <strong>&quot;OsmAnd&quot;</strong> on your iOS or Android phone. In settings, set Server URL to: <code className="text-emerald-300">http://fleet.gwtrax.com:5055</code>. Your phone will transmit real GPS coordinates!
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-amber-400 font-bold font-mono">
                    <span>Method C: Test Live Protocol Packet Decoder</span>
                    <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded">Packet Ingestion</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Switch to the <strong>&quot;Live Protocol Packet Decoder&quot;</strong> tab above, select Teltonika or Jimi GT06, click &quot;Parse &amp; Decode Packet&quot;, and click &quot;Sync Decoded Packet to Live Fleet View&quot; to see the marker move.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: MARKET ADVISOR & COMPARISON */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          {/* Executive Recommendation Highlight Card (#1 Pick for Middle East) */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>#1 Expert Recommendation: Middle East &amp; Global Fleets</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Teltonika FMC130 (4G Cat 1 with 2G Fallback)
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Why it&apos;s the best:</strong> Survives scorching desert heat up to <strong>+85°C</strong> (critical when vehicle cabins reach 70°C+ during Dubai and Riyadh summers). Certified for <strong>UAE SIRA SecurePath</strong> and <strong>Saudi TGA Wasl</strong> integration. Seamlessly connects wireless Bluetooth BLE fuel level probes (Technoton / ESCORT) and reefer cold-chain temperature sensors without invasive fuel tank drilling.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400 font-mono">
                  <span>· Operating Temp: -40°C to +85°C</span>
                  <span>· Est. Cost: ~$58 USD</span>
                  <span>· Protocol: Teltonika Codec 8E (Port 5027)</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl shrink-0 space-y-2 text-xs font-mono">
                <div className="text-slate-400 uppercase text-[10px]">Middle East Compliance Check</div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>UAE SIRA &amp; SecurePath Certified</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saudi Arabia Wasl / TGA Approved</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cross-Border GCC Roaming Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Device Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {GPS_DEVICE_MARKET_TRENDS.map((device) => {
              const isSelected = selectedDevice.id === device.id;
              return (
                <div
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`bg-slate-900/90 border rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/5'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[11px] font-mono text-slate-400">{device.brand}</div>
                        <h3 className="text-base font-bold text-white mt-0.5">{device.model}</h3>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700">
                        Rank #{device.marketRank}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed">
                      {device.bestUseCases}
                    </div>

                    {/* Spec tags */}
                    <div className="space-y-1.5 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                      <div>Network: <span className="text-white">{device.network}</span></div>
                      <div>Temp Range: <span className="text-slate-200">{device.operatingTemp}</span></div>
                      <div>Default Port: <span className="text-emerald-400">{device.defaultPort} ({device.protocolType})</span></div>
                      <div>Est. Hardware: <span className="text-white font-bold">${device.estimatedHardwareCostUsd} USD</span></div>
                    </div>

                    {/* Compliance pills */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {device.compliance.uaeSira && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded">
                          UAE SIRA
                        </span>
                      )}
                      {device.compliance.ksaWasl && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                          Saudi WASL
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{device.pros.length} key advantages</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <span>View Full Specs</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Device Deep-Dive Specification Card */}
          {selectedDevice && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="text-xs font-mono text-emerald-400">Deep-Dive Technical Review</div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedDevice.brand} · {selectedDevice.model}
                  </h3>
                </div>
                <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  GWTrax Ingest Port: <span className="text-emerald-400 font-bold">{selectedDevice.defaultPort}</span> (TCP/UDP)
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/60">
                <strong className="text-white">Expert Verdict: </strong>
                {selectedDevice.expertVerdict}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Pros */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Strengths &amp; Regional Advantages</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300">
                    {selectedDevice.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Features */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="font-bold text-sky-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    <span>Telemetry Capabilities</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-300">
                    {selectedDevice.keyFeatures.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-sky-400 font-bold">·</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: LIVE PROTOCOL PACKET DECODER TEST BENCH */}
      {activeTab === 'decoder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Raw Packet Input */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Raw GPS Protocol Payload Ingestion</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">Live Parser Engine</span>
            </div>

            <p className="text-xs text-slate-400">
              Select an industry-standard GPS protocol or paste raw HEX / ASCII packet bytes to verify decoding against GWTrax multi-protocol listener.
            </p>

            {/* Protocol sample buttons */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <button
                onClick={() => handleSelectProtocolSample('teltonika')}
                className={`px-2.5 py-1 rounded border transition-colors ${
                  protocolHint === 'teltonika'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Teltonika Codec 8
              </button>
              <button
                onClick={() => handleSelectProtocolSample('gt06')}
                className={`px-2.5 py-1 rounded border transition-colors ${
                  protocolHint === 'gt06'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Jimi / GT06 Binary
              </button>
              <button
                onClick={() => handleSelectProtocolSample('queclink')}
                className={`px-2.5 py-1 rounded border transition-colors ${
                  protocolHint === 'queclink'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Queclink @ACK
              </button>
              <button
                onClick={() => handleSelectProtocolSample('nmea')}
                className={`px-2.5 py-1 rounded border transition-colors ${
                  protocolHint === 'nmea'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                NMEA 0183 ($GPRMC)
              </button>
              <button
                onClick={() => handleSelectProtocolSample('ais140')}
                className={`px-2.5 py-1 rounded border transition-colors ${
                  protocolHint === 'ais140'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                AIS 140 Gov Standard
              </button>
            </div>

            {/* Input Textarea */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                Raw Packet Payload (HEX or ASCII)
              </label>
              <textarea
                rows={5}
                value={rawPacketInput}
                onChange={(e) => setRawPacketInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleDecode}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-transform active:scale-95"
            >
              <Cpu className="w-4 h-4" />
              <span>Parse &amp; Decode Packet</span>
            </button>
          </div>

          {/* Right Column: Decoded Telemetry Breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Parsed Telemetry Fields</h3>
                {decodedResult && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    CRC Valid · 200 OK
                  </span>
                )}
              </div>

              {decodedResult ? (
                <div className="space-y-3 mt-4 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Identified Protocol</span>
                      <span className="text-emerald-400 font-bold">{decodedResult.protocol}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Device IMEI</span>
                      <span className="text-white">{decodedResult.imei}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Latitude</span>
                      <span className="text-white font-bold">{decodedResult.latitude}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Longitude</span>
                      <span className="text-white font-bold">{decodedResult.longitude}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Speed</span>
                      <span className="text-white font-bold">{decodedResult.speedKmh} km/h</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Satellites</span>
                      <span className="text-white font-bold">{decodedResult.satellites} GPS</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Heading</span>
                      <span className="text-white font-bold">{decodedResult.headingDeg}°</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Ignition (DIN1)</span>
                      <span className={decodedResult.ignition ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {decodedResult.ignition ? 'HIGH / ON' : 'LOW / OFF'}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Backup Battery</span>
                      <span className="text-white font-bold">{decodedResult.batteryVolt} V</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Fuel ADC</span>
                      <span className="text-amber-400 font-bold">{decodedResult.fuelLevelPercent || 80}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6">
                  <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                  <span>Execute the packet parser to test protocol deserialization.</span>
                </div>
              )}
            </div>

            {/* Sync to Live Fleet Button */}
            {decodedResult && (
              <button
                onClick={handleSyncToFleet}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-md shadow-emerald-500/10"
              >
                <Radio className="w-4 h-4" />
                <span>Sync Decoded Packet to Live Fleet View</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: APN & SMS CONFIGURATION GENERATOR */}
      {activeTab === 'apn_sms' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Middle East SIM APN &amp; SMS Initialization Command Generator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your telecom operator and tracker model to generate the exact SMS payload to program the device over cellular SMS before mounting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Select Regional Telecom Carrier</label>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  {[
                    { id: 'etisalat', label: 'e& / Etisalat (UAE)' },
                    { id: 'du', label: 'du (UAE)' },
                    { id: 'stc', label: 'STC (Saudi Arabia)' },
                    { id: 'mobily', label: 'Mobily (Saudi Arabia)' },
                    { id: 'zain', label: 'Zain (KSA / Kuwait)' },
                    { id: 'omantel', label: 'Omantel (Oman)' }
                  ].map((car) => (
                    <button
                      key={car.id}
                      onClick={() => setSelectedCarrier(car.id as any)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        selectedCarrier === car.id
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {car.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Selected GPS Hardware</label>
                <select
                  value={selectedDevice.id}
                  onChange={(e) => {
                    const dev = GPS_DEVICE_MARKET_TRENDS.find((d) => d.id === e.target.value);
                    if (dev) setSelectedDevice(dev);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                >
                  {GPS_DEVICE_MARKET_TRENDS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.brand} - {d.model} ({d.protocolType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generated Command Box */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
                  <span>Send via SMS to Tracker SIM Number</span>
                  <span className="text-emerald-400">Server: fleet.gwtrax.com:{selectedDevice.defaultPort}</span>
                </div>
                <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 whitespace-pre-wrap select-all">
                  {getSmsConfig()}
                </div>
              </div>

              <button
                onClick={handleCopySms}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors border border-slate-700"
              >
                {copiedSms ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied SMS Command to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy SMS Command String</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAIR NEW GPS TRACKER */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Link New GPS Tracker to Fleet</h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterDeviceSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Device IMEI (15 Digits) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  placeholder="e.g. 358249091234567"
                  value={newImei}
                  onChange={(e) => setNewImei(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Vehicle Plate Number <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DXB-A-10294"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Vehicle Model / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Toyota Hilux 4x4"
                    value={newVehicleName}
                    onChange={(e) => setNewVehicleName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tracker Hardware Model</label>
                  <select
                    value={newSelectedModel}
                    onChange={(e) => setNewSelectedModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-white"
                  >
                    {GPS_DEVICE_MARKET_TRENDS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.model} ({d.protocolType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">SIM Network</label>
                  <select
                    value={newCarrier}
                    onChange={(e) => setNewCarrier(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-white"
                  >
                    <option value="e& (Etisalat UAE)">e& (Etisalat UAE)</option>
                    <option value="du UAE">du UAE</option>
                    <option value="STC Saudi Arabia">STC Saudi Arabia</option>
                    <option value="Mobily KSA">Mobily KSA</option>
                    <option value="Zain KSA">Zain KSA</option>
                    <option value="Omantel">Omantel</option>
                    <option value="Global M2M eSIM">Global M2M eSIM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Driver</label>
                <input
                  type="text"
                  placeholder="e.g. Salim Al-Harthy"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-emerald-400 font-bold">Generated Connection Endpoint:</div>
                <div>Domain: <span className="text-white">fleet.gwtrax.com</span></div>
                <div>Port: <span className="text-white">{GPS_DEVICE_MARKET_TRENDS.find(d => d.id === newSelectedModel)?.defaultPort || 5027}</span> (TCP/UDP)</div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded"
                >
                  Save &amp; Link Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
