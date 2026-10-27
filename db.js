import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const isDBConnected = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  let uri = process.env.MONGODB_URI;

  // 1. If explicit URI provided in environment, connect directly
  if (uri && uri.trim() !== '') {
    try {
      const conn = await mongoose.connect(uri, { autoIndex: true });
      console.log(`[Database] Connected successfully to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.error(`[Database] Failed to connect to specified MONGODB_URI: ${err.message}`);
      throw err;
    }
  }

  // 2. Production requires an explicit MONGODB_URI
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: MONGODB_URI environment variable is required in production.');
  }

  // 3. In development, try default local mongod instance first (mongodb://127.0.0.1:27017/smartbiz)
  try {
    const localUri = 'mongodb://127.0.0.1:27017/smartbiz';
    const conn = await mongoose.connect(localUri, { 
      serverSelectionTimeoutMS: 1200,
      autoIndex: true 
    });
    console.log(`[Database] Connected to local MongoDB at: ${localUri}`);
    return conn;
  } catch (localErr) {
    // Local standard instance not active, continue to embedded engine
  }

  // 4. Default in development: Launch embedded MongoDB memory engine automatically
  if (process.env.USE_EMBEDDED_MONGODB !== 'false') {
    try {
      console.log('[Database] Starting high-performance embedded MongoDB engine...');
      mongoMemoryServer = await MongoMemoryServer.create();
      uri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(uri, { autoIndex: true });
      console.log(`[Database] Embedded MongoDB running and connected at: ${uri}`);
      return conn;
    } catch (err) {
      console.warn('[Database] Embedded MongoDB startup notice:', err.message);
    }
  }

  console.log('\n========================================================================');
  console.log(' [MONGODB STATUS]');
  console.log(' SmartBiz Express Server is LIVE on port ' + (process.env.PORT || 5000));
  console.log(' To connect MongoDB database persistence:');
  console.log('   1. Start a local MongoDB service: mongodb://127.0.0.1:27017/smartbiz');
  console.log('   2. Or set MONGODB_URI in server/.env with your free MongoDB Atlas URI:');
  console.log('      MONGODB_URI=mongodb+srv://<user>:<pwd>@cluster.mongodb.net/smartbiz');
  console.log('========================================================================\n');

  return null;
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (err) {
    console.error('[Database] Error during MongoDB disconnect:', err.message);
  }
};
