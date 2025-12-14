import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './services/db';
import healthCheckRoutes from './routes/healthCheckRoutes';
import authRoutes from './routes/authRoutes';
import shortUrlRoutes from './routes/shortUrlRoutes';
import { errorHandler } from './http/errorsHandler';
import cookieParser from 'cookie-parser';
import { requireAuth } from './middleware/auth';
import redis from './services/redis';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use('/health', healthCheckRoutes);
app.use('/auth', authRoutes);
app.use('/short-url', shortUrlRoutes);

// Error handler must be registered after all routes
app.use(errorHandler);

let server: any;

async function start() {
  try {
    // Check for required environment variables
    if (!process.env.DATABASE_URL) {
      console.error('[ERROR] DATABASE_URL environment variable is required');
      process.exit(1);
    }

    await db.query('SELECT 1');
    console.log('[DB] connected');

    server = app.listen(PORT, () => {
      console.log(`[SERVER] listening on ${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error('PORT IN USE');
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('[ERROR] Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown(signal: string) {
  console.log(`Shutdown: ${signal}`);
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGQUIT', () => shutdown('SIGQUIT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught Exception:', error);
  process.exit(1);
});

start();
