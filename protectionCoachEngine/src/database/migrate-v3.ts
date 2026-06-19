import pool from '../config/database';

const migration = `

-- ═══════════════════════════════════════════════
-- V3 MIGRATION: AI-generated customer insights cache
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS customer_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- AI-generated recommendation cards (JSON array)
  recommendations JSONB NOT NULL DEFAULT '[]',

  -- AI-generated prose: why this customer is an opportunity for the advisor
  why_opportunity TEXT NOT NULL DEFAULT '',

  -- AI-generated customer-facing tip (shown on their protection portal)
  customer_tip TEXT NOT NULL DEFAULT '',

  -- AI-generated talking points (JSON array of strings)
  talking_points JSONB NOT NULL DEFAULT '[]',

  -- AI-generated lesson/action items for advisor (JSON array)
  lesson_recommendations JSONB NOT NULL DEFAULT '[]',

  -- Metadata for staleness tracking
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  triggered_by VARCHAR(50) DEFAULT 'INITIAL',
  
  -- Snapshot of scores at generation time (to detect drift)
  pis_at_generation DECIMAL(5, 2),
  os_at_generation DECIMAL(5, 2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_insights_customer ON customer_insights(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_insights_generated ON customer_insights(generated_at);

-- Apply updated_at trigger
DO $$ BEGIN
  CREATE TRIGGER set_customer_insights_updated_at BEFORE UPDATE ON customer_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

`;

async function runMigration() {
  console.log('🚀 Running V3 migration (AI insights cache table)...\n');

  try {
    await pool.query(migration);
    console.log('✅ V3 Migration completed successfully!');
    console.log('   Table created: customer_insights');
    console.log('   Columns: recommendations, why_opportunity, talking_points, lesson_recommendations');
    console.log('   Metadata: generated_at, triggered_by, pis_at_generation, os_at_generation');
  } catch (error) {
    console.error('❌ V3 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
