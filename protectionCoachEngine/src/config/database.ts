import { Pool } from 'pg';
import dns from 'dns';
import { env } from './env';

// Force IPv4 resolution (fixes ETIMEDOUT on IPv6-only DNS results)
dns.setDefaultResultOrder('ipv4first');

// Connection pool for PostgreSQL (Neon)
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Neon cloud
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ PostgreSQL pool connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

export default pool;
