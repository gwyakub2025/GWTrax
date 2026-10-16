import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Cpu, 
  MapPin, 
  User, 
  Phone, 
  Radio, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Thermometer,
  Zap
} from 'lucide-react';
import { Vehicle } from '../types/fleet.ts';

interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveVehicle: (vehicle: Vehicle) => Promise<void>;
}

export const RegisterVehicleModal: React.FC<RegisterVehicleModalProps> = ({
  isOpen,
  onClose,
  onSaveVehicle
}) => {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState<Vehicle['type']>('heavy_truck');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [trackerBrand, setTrackerBrand] = useState('Teltonika Telematics');
  const [trackerModel, setTrackerModel] = useState('Teltonika FMC130 (4G Cat 1)');
  const [imei, setImei] = useState('');
  const [protocol, setProtocol] = useState('Codec 8E Extended (TCP 5027)');
  const [port, setPort] = useState<number>(5027);
  const [carrier, setCarrier] = useState('e& (Etisalat UAE)');
  const [apn, setApn] = useState('jpinternet.me');
  const [latitude, setLatitude] = useState<number>(25.2048);
  const [longitude, setLongitude] = useState<number>(55.2708);
  const [address, setAddress] = useState('Sheikh Zayed Road (E11)');
  const [isReefer, setIsReefer] = useState(false);
  const [cargoTemp, setCargoTemp] = useState<number>(-20.0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDevicePresetChange = (preset: string) => {
    switch (preset) {
      case 'teltonika_fmc130':
        setTrackerBrand('Teltonika Telematics');
        setTrackerModel('Teltonika FMC130 (4G Cat 1)');
        setProtocol('Codec 8E Extended (TCP 5027)');
        setPort(5027);
        break;
      case 'jimi_vl02':
        setTrackerBrand('Jimi IoT / Concox');
        setTrackerModel('Jimi IoT VL02 (4G Cat 1)');
        setProtocol('GT06 Protocol (TCP 5023)');
        setPort(5023);
        break;
      case 'queclink_gv300':
        setTrackerBrand('Queclink Wireless');
        setTrackerModel('Queclink GV300');
        setProtocol('Queclink @ACK (TCP 5004)');
        setPort(5004);
        break;
      case 'mobile_phone':
        setTrackerBrand('GWTrax Mobile Beacon');
        setTrackerModel('Mobile Smartphone Beacon');
        setProtocol('HTTP / JSON REST (Port 443)');
        setPort(443);
        break;
      default:
        break;
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(6)));
          setLongitude(Number(pos.coords.longitude.toFixed(6)));
          setAddress(`Live GPS Fix: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          console.warn('Geolocation lookup failed:', err);
          setErrorMsg('Unable to retrieve GPS from browser. Please type coordinates manually.');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) {
      setErrorMsg('Please enter a vehicle license plate number.');
      return;
    }
    if (!vehicleName.trim()) {
      setErrorMsg('Please enter a vehicle model name or descriptor.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const vehicleId = `VEH-${Date.now().toString().slice(-6)}`;
    const driverId = `DRV-${Date.now().toString().slice(-6)}`;

    const newVehicle: Vehicle = {
      id: vehicleId,
      plateNumber: plateNumber.trim().toUpperCase(),
      name: vehicleName.trim(),
      type: vehicleType,
      driverId,
      driverName: driverName.trim() || 'Unassigned Operator',
      status: 'stopped',
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        address: address.trim() || 'Custom Fleet Location',
        city: 'Dubai',
        country: 'United Arab Emirates'
      },
      telemetry: {
        speedKmh: 0,
        speedLimitKmh: 80,
        headingDeg: 0,
        ignition: false,
        fuelLevelPercent: 100,
        fuelCapacityLiters: vehicleType === 'heavy_truck' || vehicleType === 'tanker' ? 500 : 80,
        engineRpm: 0,
        coolantTempC: 35,
        ...(isReefer ? { cargoTempC: cargoTemp } : {}),
        batteryVoltage: vehicleType === 'heavy_truck' || vehicleType === 'tanker' ? 24.4 : 12.6,
        odometerKm: 0,
        satellites: 14,
        gsmSignalPercent: 95,
        immobilizerCutoffActive: false,
        tamperDetected: false,
        lastPingTime: 'Just now'
      },
      deviceInfo: {
        imei: imei.trim() || `358${Date.now().toString().slice(-12)}`,
        deviceModel: trackerModel,
        brand: trackerBrand,
        protocol,
        port,
        firmwareVersion: 'v1.0.0-PROD',
        simImsi: '424021000000000',
        carrier,
        compliance: 'UAE SIRA & SecurePath Ready'
      },
      historyTrail: [[Number(latitude), Number(longitude)]]
    };

    try {
      await onSaveVehicle(newVehicle);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save vehicle to Firebase Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Register Fleet Vehicle &amp; GPS Tracker</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Firebase Persistent
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sync any physical GPS telematics hardware or mobile beacon directly to the GWTrax database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Quick Hardware Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Hardware Tracker Preset:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDevicePresetChange('teltonika_fmc130')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  trackerModel.includes('Teltonika FMC130')
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">Teltonika 4G</div>
                <div className="text-[10px] text-slate-500">FMC130 Cat 1</div>
              </button>

              <button
                type="button"
                onClick={() => handleDevicePresetChange('jimi_vl02')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  trackerModel.includes('Jimi IoT VL02')
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">Jimi IoT VL02</div>
                <div className="text-[10px] text-slate-500">GT06 / WASL</div>
              </button>

              <button
                type="button"
                onClick={() => handleDevicePresetChange('queclink_gv300')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  trackerModel.includes('Queclink GV300')
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">Queclink GV300</div>
                <div className="text-[10px] text-slate-500">@ACK Port 5004</div>
              </button>

              <button
                type="button"
                onClick={() => handleDevicePresetChange('mobile_phone')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  trackerModel.includes('Mobile Smartphone')
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">Mobile Phone</div>
                <div className="text-[10px] text-slate-500">HTML5 Geolocation</div>
              </button>
            </div>
          </div>

          {/* Section 1: Vehicle & Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                License Plate Number *
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="e.g. DXB-C-9842 or AUH-10948"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Vehicle Make / Descriptor *
              </label>
              <input
                type="text"
                required
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                placeholder="e.g. Mercedes-Benz Actros 3340"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Vehicle Category
              </label>
              <select
                value={vehicleType}
                onChange={(e) => {
                  const val = e.target.value as Vehicle['type'];
                  setVehicleType(val);
                  if (val === 'reefer_truck') setIsReefer(true);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="heavy_truck">Heavy Commercial Truck (Trailer/Chassis)</option>
                <option value="reefer_truck">Reefer Truck (Cold-Chain Refrigerated)</option>
                <option value="delivery_van">Express Delivery Van (Parcels/Courier)</option>
                <option value="tanker">Fuel / Chemical Tanker (Hazmat)</option>
                <option value="flatbed">Flatbed / Container Transport</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Hardware Tracker IMEI (15 Digits)
              </label>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="e.g. 864201048821942 or 358249091234567"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Driver & Telematics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assigned Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Tariq Al-Mansoor"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Driver Contact Phone
              </label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="e.g. +971 50 123 4567"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: SIM & Network */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cellular Carrier
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="e& (Etisalat UAE)">e& (Etisalat UAE)</option>
                <option value="du UAE">du UAE</option>
                <option value="STC Saudi">STC Saudi Arabia</option>
                <option value="Mobily KSA">Mobily KSA</option>
                <option value="Zain Telecom">Zain Telecom</option>
                <option value="Omantel">Omantel</option>
                <option value="Ooredoo Qatar">Ooredoo Qatar</option>
                <option value="Batelco Bahrain">Batelco Bahrain</option>
                <option value="Vodafone Global IoT">Vodafone Global IoT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                SIM Card APN
              </label>
              <input
                type="text"
                value={apn}
                onChange={(e) => setApn(e.target.value)}
                placeholder="e.g. jpinternet.me or du"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Server Listener Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="5027"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 4: Initial Coordinates */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Initial GPS Coordinates:</span>
              </span>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                Use My Current Location
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  placeholder="e.g. 25.2048"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  placeholder="e.g. 55.2708"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-0.5">Location Address Label</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. JAFZA Gate 4 Logistics Hub, Dubai"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Optional Reefer Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-sky-400" />
              <label htmlFor="reeferToggle" className="text-xs font-medium text-slate-200 cursor-pointer">
                Equipped with Reefer Cold Chain Temperature Sensor
              </label>
            </div>
            <div className="flex items-center gap-3">
              {isReefer && (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-slate-400">Target:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={cargoTemp}
                    onChange={(e) => setCargoTemp(Number(e.target.value))}
                    className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-center text-sky-300"
                  />
                  <span className="text-slate-400">°C</span>
                </div>
              )}
              <input
                id="reeferToggle"
                type="checkbox"
                checked={isReefer}
                onChange={(e) => setIsReefer(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 focus:outline-none accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Storing to Firebase...' : 'Save Tracker to Firebase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
