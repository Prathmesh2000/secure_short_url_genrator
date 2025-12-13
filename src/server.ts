import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './services/db';
import healthCheckRoutes from './routes/healthCheckRoutes';
import usersRoutes from './routes/usersRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cors());

// Health check
app.use('/health', healthCheckRoutes);
app.use('users', usersRoutes);

async function startServer() {
  try {
    // Verify DB on startup
    await db.query('SELECT 1');
    console.log('[DB] connection verified');

    const server = app.listen(PORT, () => {
      console.log(`[SERVER] running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('[SERVER] shutting down...');
      await db.close();
      server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[SERVER] startup failed', error);
    process.exit(1);
  }
}

startServer();
