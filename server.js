import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

import { User } from './models/User.js';
import { seedDatabase } from './utils/seedData.js';

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    console.log('[Server] Connecting to MongoDB database...');
    await connectDB();
    
    // Auto-seed if database is fresh (embedded in-memory or empty database)
    const userCount = await User.countDocuments().catch(() => 0);
    if (userCount === 0) {
      console.log('[Server] Database is empty. Seeding initial demo workspace & accounts...');
      await seedDatabase().catch((e) => console.warn('[Server] Seed notice:', e.message));
    }
  } catch (err) {
    console.warn('[Server] Notice: Database connection initialized in standby mode:', err.message);
  }

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`  SmartBiz SaaS Platform Backend Running`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  API Base: http://localhost:${PORT}/api/v1`);
    console.log(`  Health Check: http://localhost:${PORT}/health`);
    console.log(`====================================================`);
  });
};

const handleShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP server closed.');
    });
  }
  await disconnectDB();
  process.exit(0);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
