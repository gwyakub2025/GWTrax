import { MongoClient, Db } from 'mongodb';

// Vercel / Node.js Serverless cached MongoDB Client
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'gwtrax_telematics';

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR.
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export async function getMongoDb(): Promise<Db | null> {
  if (!clientPromise) {
    return null;
  }
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return null;
  }
}

export async function saveTelemetryToMongo(telemetry: Record<string, any>): Promise<boolean> {
  try {
    const db = await getMongoDb();
    if (!db) return false;

    const collectionName = process.env.MONGO_COLLECTION_TELEMETRY || 'telemetry_logs';
    await db.collection(collectionName).insertOne({
      ...telemetry,
      createdAt: new Date(),
    });
    return true;
  } catch (err) {
    console.error('Error writing telemetry to MongoDB:', err);
    return false;
  }
}
