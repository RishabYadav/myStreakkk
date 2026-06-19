import pool from '../../config/database';

export interface CreateCustomerDto {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth: string;
  gender?: string;
  marital_status?: string;
  life_stage: string;
  dependents?: number;
  annual_income?: number;
  occupation?: string;
  smoker?: boolean;
  city?: string;
  state?: string;
  pincode?: string;
  existing_liabilities?: number;
  total_assets?: number;
}

export async function create(data: CreateCustomerDto) {
  const query = `
    INSERT INTO customers (
      first_name, last_name, email, phone, date_of_birth,
      gender, marital_status, life_stage, dependents, annual_income,
      occupation, smoker, city, state, pincode,
      existing_liabilities, total_assets
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *
  `;
  const values = [
    data.first_name, data.last_name, data.email, data.phone || null, data.date_of_birth,
    data.gender || null, data.marital_status || null, data.life_stage, data.dependents || 0, data.annual_income || null,
    data.occupation || null, data.smoker || false, data.city || null, data.state || null, data.pincode || null,
    data.existing_liabilities || null, data.total_assets || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function findAll(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  const query = `SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
  const countQuery = `SELECT COUNT(*) FROM customers`;

  const [result, countResult] = await Promise.all([
    pool.query(query, [limit, offset]),
    pool.query(countQuery),
  ]);

  return {
    customers: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  };
}

export async function findById(id: string) {
  const query = `SELECT * FROM customers WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function update(id: string, data: Partial<CreateCustomerDto>) {
  // Build dynamic SET clause
  const fields = Object.keys(data).filter((key) => data[key as keyof CreateCustomerDto] !== undefined);
  if (fields.length === 0) return null;

  const setClauses = fields.map((field, i) => `${field} = $${i + 2}`);
  const values = fields.map((field) => data[field as keyof CreateCustomerDto]);

  const query = `
    UPDATE customers 
    SET ${setClauses.join(', ')}
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [id, ...values]);
  return result.rows[0] || null;
}

export async function remove(id: string) {
  const query = `DELETE FROM customers WHERE id = $1 RETURNING *`;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// Get customer with all their policies
export async function findWithPolicies(id: string) {
  const customerQuery = `SELECT * FROM customers WHERE id = $1`;
  const policiesQuery = `SELECT * FROM policies WHERE customer_id = $1 ORDER BY created_at DESC`;

  const [customerResult, policiesResult] = await Promise.all([
    pool.query(customerQuery, [id]),
    pool.query(policiesQuery, [id]),
  ]);

  if (!customerResult.rows[0]) return null;

  return {
    ...customerResult.rows[0],
    policies: policiesResult.rows,
  };
}
