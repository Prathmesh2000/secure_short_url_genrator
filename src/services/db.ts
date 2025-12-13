import dotenv from 'dotenv';
dotenv.config();

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_SIZE) || 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
});

pool.on('error', (err: Error) => {
  console.error('[DB] unexpected error', err);
  process.exit(1);
});

// Generic, parameterised query
export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

// Transaction helper
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Graceful shutdown support
export async function close(): Promise<void> {
  await pool.end();
}

export default {
  query,
  withTransaction,
  close
};
