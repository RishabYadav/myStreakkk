import pool from '../../config/database';
import { emitEvent } from '../events/event-bus';

export interface CreatePolicyDto {
  customer_id: string;
  policy_number: string;
  source: 'POLICYBAZAAR' | 'EXTERNAL';
  vendor_name: string;
  type: string;
  status?: string;
  sum_assured: number;
  premium_amount: number;
  payment_frequency: string;
  start_date: string;
  end_date: string;
  renewal_date?: string;
  nominees?: object;
  riders?: object;
  metadata?: object;
}

export async function create(data: CreatePolicyDto) {
  const query = `
    INSERT INTO policies (
      customer_id, policy_number, source, vendor_name, type,
      status, sum_assured, premium_amount, payment_frequency,
      start_date, end_date, renewal_date, nominees, riders, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *
  `;
  const values = [
    data.customer_id, data.policy_number, data.source, data.vendor_name, data.type,
    data.status || 'ACTIVE', data.sum_assured, data.premium_amount, data.payment_frequency,
    data.start_date, data.end_date, data.renewal_date || null,
    data.nominees ? JSON.stringify(data.nominees) : null,
    data.riders ? JSON.stringify(data.riders) : null,
    data.metadata ? JSON.stringify(data.metadata) : null,
  ];

  const result = await pool.query(query, values);
  const policy = result.rows[0];

  // Emit event for score recalculation
  await emitEvent({
    customer_id: data.customer_id,
    policy_id: policy.id,
    event_type: 'POLICY_CREATED',
    payload: { policy_number: data.policy_number, type: data.type, sum_assured: data.sum_assured },
  });

  return policy;
}

export async function findByCustomerId(customerId: string) {
  const query = `SELECT * FROM policies WHERE customer_id = $1 ORDER BY created_at DESC`;
  const result = await pool.query(query, [customerId]);
  return result.rows;
}

export async function findById(id: string) {
  const query = `SELECT * FROM policies WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function update(id: string, data: Partial<CreatePolicyDto>) {
  const fields = Object.keys(data).filter((key) => data[key as keyof CreatePolicyDto] !== undefined);
  if (fields.length === 0) return null;

  const setClauses = fields.map((field, i) => `${field} = $${i + 2}`);
  const values = fields.map((field) => {
    const val = data[field as keyof CreatePolicyDto];
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return val;
  });

  const query = `UPDATE policies SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id, ...values]);
  const policy = result.rows[0];

  if (policy) {
    await emitEvent({
      customer_id: policy.customer_id,
      policy_id: policy.id,
      event_type: 'POLICY_UPDATED',
      payload: { updated_fields: fields },
    });
  }

  return policy || null;
}

export async function remove(id: string) {
  // Get policy info before deleting for the event
  const existing = await findById(id);
  if (!existing) return null;

  const query = `DELETE FROM policies WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);

  await emitEvent({
    customer_id: existing.customer_id,
    policy_id: null,
    event_type: 'POLICY_CANCELLED',
    payload: { policy_number: existing.policy_number },
  });

  return result.rows[0] || null;
}
