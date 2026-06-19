import pool from '../config/database';

const migration = `

-- ═══════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marital_status AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE life_stage AS ENUM ('YOUNG_SINGLE', 'YOUNG_COUPLE', 'NEW_PARENT', 'GROWING_FAMILY', 'ESTABLISHED_FAMILY', 'PRE_RETIREMENT', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE policy_source AS ENUM ('POLICYBAZAAR', 'EXTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE policy_status AS ENUM ('ACTIVE', 'LAPSED', 'EXPIRED', 'CANCELLED', 'PENDING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE policy_type AS ENUM ('TERM_LIFE', 'WHOLE_LIFE', 'HEALTH', 'CRITICAL_ILLNESS', 'ACCIDENT', 'DISABILITY', 'HOME', 'MOTOR', 'TRAVEL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_frequency AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'ONE_TIME');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE score_type AS ENUM ('PROTECTION', 'OPPORTUNITY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('POLICY_CREATED', 'POLICY_UPDATED', 'POLICY_EXPIRED', 'POLICY_CANCELLED', 'POLICY_RENEWED', 'CUSTOMER_PROFILE_UPDATED', 'CUSTOMER_ENGAGEMENT_LOGGED', 'SCORE_RECALCULATED', 'SIMULATION_RUN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE simulation_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════
-- EXTENSIONS
-- ═══════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════
-- CUSTOMERS TABLE
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE NOT NULL,
  gender gender,
  marital_status marital_status,
  life_stage life_stage NOT NULL,
  dependents INT DEFAULT 0,
  annual_income DECIMAL(15, 2),
  occupation VARCHAR(200),
  smoker BOOLEAN DEFAULT false,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  existing_liabilities DECIMAL(15, 2),
  total_assets DECIMAL(15, 2),
  last_engagement_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_life_stage ON customers(life_stage);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_last_engagement ON customers(last_engagement_at);

-- ═══════════════════════════════════════════════
-- POLICIES TABLE
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  policy_number VARCHAR(100) UNIQUE NOT NULL,
  source policy_source NOT NULL,
  vendor_name VARCHAR(200) NOT NULL,
  type policy_type NOT NULL,
  status policy_status DEFAULT 'ACTIVE',
  sum_assured DECIMAL(15, 2) NOT NULL,
  premium_amount DECIMAL(12, 2) NOT NULL,
  payment_frequency payment_frequency NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  last_premium_paid_at TIMESTAMPTZ,
  nominees JSONB,
  riders JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_customer_id ON policies(customer_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_source ON policies(source);
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(type);
CREATE INDEX IF NOT EXISTS idx_policies_end_date ON policies(end_date);
CREATE INDEX IF NOT EXISTS idx_policies_renewal_date ON policies(renewal_date);

-- ═══════════════════════════════════════════════
-- PROTECTION SCORES TABLE (Customer Facing)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS protection_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  overall_score DECIMAL(5, 2) NOT NULL,
  coverage_adequacy DECIMAL(5, 2) NOT NULL,
  life_stage_readiness DECIMAL(5, 2) NOT NULL,
  financial_vulnerability DECIMAL(5, 2) NOT NULL,
  family_risk_protection DECIMAL(5, 2) NOT NULL,
  protection_freshness DECIMAL(5, 2) NOT NULL,
  engagement_strength DECIMAL(5, 2) NOT NULL,
  data_confidence DECIMAL(5, 2) NOT NULL,
  weights JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protection_scores_overall ON protection_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_protection_scores_calculated ON protection_scores(calculated_at);

-- ═══════════════════════════════════════════════
-- OPPORTUNITY SCORES TABLE (Advisor Facing)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS opportunity_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  overall_score DECIMAL(5, 2) NOT NULL,
  protection_gap_severity DECIMAL(5, 2) NOT NULL,
  renewal_urgency DECIMAL(5, 2) NOT NULL,
  conversion_likelihood DECIMAL(5, 2) NOT NULL,
  revenue_potential DECIMAL(5, 2) NOT NULL,
  relationship_strength DECIMAL(5, 2) NOT NULL,
  weights JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_scores_overall ON opportunity_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_opportunity_scores_calculated ON opportunity_scores(calculated_at);

-- ═══════════════════════════════════════════════
-- SCORE HISTORY TABLE (Trend Tracking)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS score_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  score_type score_type NOT NULL,
  overall_score DECIMAL(5, 2) NOT NULL,
  dimensions JSONB NOT NULL,
  triggered_by event_type NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_histories_customer_type ON score_histories(customer_id, score_type);
CREATE INDEX IF NOT EXISTS idx_score_histories_calculated ON score_histories(calculated_at);
CREATE INDEX IF NOT EXISTS idx_score_histories_customer_calculated ON score_histories(customer_id, calculated_at);

-- ═══════════════════════════════════════════════
-- DOMAIN EVENTS TABLE
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  event_type event_type NOT NULL,
  status event_status DEFAULT 'PENDING',
  payload JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domain_events_customer ON domain_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_domain_events_status ON domain_events(status);
CREATE INDEX IF NOT EXISTS idx_domain_events_created ON domain_events(created_at);
CREATE INDEX IF NOT EXISTS idx_domain_events_status_created ON domain_events(status, created_at);

-- ═══════════════════════════════════════════════
-- RISK SIMULATIONS TABLE
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS risk_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  scenario_name VARCHAR(255) NOT NULL,
  scenario_params JSONB NOT NULL,
  status simulation_status DEFAULT 'PENDING',
  projected_protection_score DECIMAL(5, 2),
  projected_opportunity_score DECIMAL(5, 2),
  projected_dimensions JSONB,
  recommendations JSONB,
  risk_factors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_risk_simulations_customer ON risk_simulations(customer_id);
CREATE INDEX IF NOT EXISTS idx_risk_simulations_status ON risk_simulations(status);
CREATE INDEX IF NOT EXISTS idx_risk_simulations_customer_created ON risk_simulations(customer_id, created_at);

-- ═══════════════════════════════════════════════
-- UPDATED_AT TRIGGER FUNCTION
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DO $$ BEGIN
  CREATE TRIGGER set_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_protection_scores_updated_at BEFORE UPDATE ON protection_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_opportunity_scores_updated_at BEFORE UPDATE ON opportunity_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

`;

async function runMigration() {
  console.log('🚀 Running database migration...\n');
  
  try {
    await pool.query(migration);
    console.log('✅ Migration completed successfully!');
    console.log('   Tables created:');
    console.log('   - customers');
    console.log('   - policies');
    console.log('   - protection_scores');
    console.log('   - opportunity_scores');
    console.log('   - score_histories');
    console.log('   - domain_events');
    console.log('   - risk_simulations');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
