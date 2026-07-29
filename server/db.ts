import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Supabase (and most managed Postgres) require SSL. Disable strict cert
// verification for the provider-managed certificate. Local dev over
// localhost connects without SSL.
const useSSL = !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

// Standard node-postgres pool, suitable for a long-running server (Railway).
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

// Log unexpected pool errors instead of crashing the process.
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Graceful shutdown.
async function closePool() {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);
