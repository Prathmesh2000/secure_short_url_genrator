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
}

async function shutdown(signal: string) {
  console.log(`Shutdown: ${signal}`);
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGQUIT', shutdown);
process.on('exit', shutdown);

start();
