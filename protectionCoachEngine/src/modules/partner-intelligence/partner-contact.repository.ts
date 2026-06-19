import pool from '../../config/database';

export interface PartnerCustomerContact {
  customer_id: string;
  name: string;
  phone: string | null;
}

export async function findPartnerCustomerContact(
  partnerId: string,
  customerId: string
): Promise<PartnerCustomerContact | null> {
  const result = await pool.query<{
    id: string;
    external_id: string | null;
    first_name: string;
    last_name: string;
    phone: string | null;
  }>(
    `SELECT id, external_id, first_name, last_name, phone
     FROM customers
     WHERE partner_id = $1
       AND (id::text = $2 OR external_id = $2)
     LIMIT 1`,
    [partnerId, customerId]
  );
  const customer = result.rows[0];
  if (!customer) return null;
  return {
    customer_id: customer.external_id || customer.id,
    name: `${customer.first_name} ${customer.last_name}`,
    phone: customer.phone,
  };
}
