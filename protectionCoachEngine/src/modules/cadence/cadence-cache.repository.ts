import pool from '../../config/database';
import { CadenceOutput, cadenceOutputSchema } from './cadence.schema';

export interface CadenceCacheEntry {
  input_hash: string;
  model: string;
  output: CadenceOutput;
  generated_at: Date;
}

interface CacheRow {
  input_hash: string;
  model: string;
  output: unknown;
  generated_at: Date;
}

export async function findExactCache(
  customerId: string,
  inputHash: string,
  model: string
): Promise<CadenceCacheEntry | null> {
  const result = await pool.query<CacheRow>(
    `SELECT input_hash, model, output, generated_at
     FROM cadence_ai_cache
     WHERE customer_id = $1 AND input_hash = $2 AND model = $3
     LIMIT 1`,
    [customerId, inputHash, model]
  );
  return result.rows[0] ? mapCacheRow(result.rows[0]) : null;
}

export async function findLatestCache(customerId: string): Promise<CadenceCacheEntry | null> {
  const result = await pool.query<CacheRow>(
    `SELECT input_hash, model, output, generated_at
     FROM cadence_ai_cache
     WHERE customer_id = $1
     ORDER BY generated_at DESC
     LIMIT 1`,
    [customerId]
  );
  return result.rows[0] ? mapCacheRow(result.rows[0]) : null;
}

export async function saveCache(
  customerId: string,
  inputHash: string,
  model: string,
  output: CadenceOutput
): Promise<CadenceCacheEntry> {
  const result = await pool.query<CacheRow>(
    `INSERT INTO cadence_ai_cache (customer_id, input_hash, model, output)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (customer_id, input_hash, model)
     DO UPDATE SET output = EXCLUDED.output, generated_at = NOW(), updated_at = NOW()
     RETURNING input_hash, model, output, generated_at`,
    [customerId, inputHash, model, JSON.stringify(output)]
  );
  return mapCacheRow(result.rows[0]);
}

function mapCacheRow(row: CacheRow): CadenceCacheEntry {
  const rawOutput = typeof row.output === 'string' ? JSON.parse(row.output) : row.output;
  return {
    input_hash: row.input_hash,
    model: row.model,
    output: cadenceOutputSchema.parse(rawOutput),
    generated_at: row.generated_at,
  };
}
