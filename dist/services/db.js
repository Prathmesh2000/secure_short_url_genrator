"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.withTransaction = withTransaction;
exports.close = close;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_SIZE) || 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
});
pool.on('error', (err) => {
    console.error('[DB] unexpected error', err);
    process.exit(1);
});
// Generic, parameterised query
async function query(text, params = []) {
    return pool.query(text, params);
}
// Transaction helper
async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
}
// Graceful shutdown support
async function close() {
    await pool.end();
}
exports.default = {
    query,
    withTransaction,
    close
};
