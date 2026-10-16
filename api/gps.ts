// Vercel Serverless Function to receive GPS telemetry from Traccar Client & OsmAnd
// Endpoint: https://gwtrax.vercel.app/api/gps

export default function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse query parameters (standard Traccar Client / OsmAnd format)
  // GET or POST: ?id=123456&lat=25.2048&lon=55.2708&timestamp=1729074000&speed=15.2&bearing=120&altitude=18&batt=85
  const query = req.method === 'POST' && req.body ? { ...req.query, ...req.body } : req.query;

  const deviceId = query.id || query.device_id || query.imei || 'MOBILE-01';
  const lat = parseFloat(query.lat || query.latitude || '0');
  const lon = parseFloat(query.lon || query.lng || query.longitude || '0');
  const speedKnotsOrKmh = parseFloat(query.speed || '0');
  // Traccar client reports speed in knots or km/h; convert knots to km/h if small or standard
  const speedKmh = Math.round(speedKnotsOrKmh * 1.852);
  const bearing = parseFloat(query.bearing || query.heading || '0');
  const altitude = parseFloat(query.altitude || '0');
  const battery = parseFloat(query.batt || query.battery || '100');

  const telemetry = {
    status: 'success',
    message: 'Telemetry received by GWTrax Gateway',
    deviceId,
    latitude: lat,
    longitude: lon,
    speedKmh,
    bearing,
    altitude,
    battery,
    receivedAt: new Date().toISOString()
  };

  // Return standard HTTP 200 OK expected by Traccar Client
  res.status(200).json(telemetry);
}
