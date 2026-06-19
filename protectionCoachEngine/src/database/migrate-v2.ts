import pool from '../config/database';

const migration = `

-- ═══════════════════════════════════════════════
-- V2 MIGRATION: Align customer schema with scoring spec
-- ═══════════════════════════════════════════════

-- Add coverage flags to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS health_cover BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS term_cover BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS life_cover BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS motor_cover BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS external_policies INT DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS coverage_source JSONB DEFAULT '{}';

-- Family/vulnerability attributes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS children INT DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS elderly_parent_dependent BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS single_earner BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS home_loan BOOLEAN DEFAULT false;

-- Engagement/relationship attributes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS renewal_due_days INT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_interaction_days INT DEFAULT 999;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS known_pb_policies INT DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Partner/agent relationship
ALTER TABLE customers ADD COLUMN IF NOT EXISTS partner_id VARCHAR(50);

-- Index for partner ranking queries
CREATE INDEX IF NOT EXISTS idx_customers_partner_id ON customers(partner_id);

`;

async function runMigration() {
  console.log('🚀 Running V2 migration (scoring spec alignment)...\n');

  try {
    await pool.query(migration);
    console.log('✅ V2 Migration completed successfully!');
    console.log('   Added columns: health_cover, term_cover, life_cover, motor_cover');
    console.log('   Added columns: external_policies, coverage_source');
    console.log('   Added columns: children, elderly_parent_dependent, single_earner, home_loan');
    console.log('   Added columns: renewal_due_days, last_interaction_days, known_pb_policies, profile_complete');
    console.log('   Added columns: partner_id');
  } catch (error) {
    console.error('❌ V2 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
