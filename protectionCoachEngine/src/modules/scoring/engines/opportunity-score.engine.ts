import pool from '../../../config/database';

/**
 * Opportunity Score (OS)
 * Agent lens. 100-point score. Measures which customer the agent should act on today.
 *
 * CRITICAL: The AI picks on Opportunity Score, NOT Protection Score.
 *
 * Dimensions & max weights:
 *   Protection Gap Severity:  30
 *   Renewal Urgency:          25
 *   Conversion Likelihood:    20
 *   Revenue Potential:        15
 *   Relationship Strength:    10
 *   TOTAL:                   100
 */

export async function calculateOpportunityScore(customerId: string) {
  const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])).rows[0];
  if (!customer) throw new Error(`Customer ${customerId} not found`);

  const gap = protectionGapSeverity(customer);
  const urgency = renewalUrgency(customer);
  const conv = conversionLikelihood(customer);
  const revenue = revenuePotential(customer);
  const rel = relationshipStrength(customer);

  const total = gap + urgency + conv + revenue + rel;

  const breakdown = {
    protection_gap_severity: gap,
    renewal_urgency: urgency,
    conversion_likelihood: conv,
    revenue_potential: revenue,
    relationship_strength: rel,
  };

  // Upsert opportunity score in DB
  const upsertQuery = `
    INSERT INTO opportunity_scores (
      customer_id, overall_score, protection_gap_severity, renewal_urgency,
      conversion_likelihood, revenue_potential, relationship_strength,
      weights, calculated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
    ON CONFLICT (customer_id) DO UPDATE SET
      overall_score = $2, protection_gap_severity = $3, renewal_urgency = $4,
      conversion_likelihood = $5, revenue_potential = $6, relationship_strength = $7,
      weights = $8, calculated_at = NOW()
    RETURNING *
  `;

  await pool.query(upsertQuery, [
    customerId, total,
    gap, urgency, conv, revenue, rel,
    JSON.stringify(breakdown),
  ]);

  // Save to history
  await pool.query(
    `INSERT INTO score_histories (customer_id, score_type, overall_score, dimensions, triggered_by)
     VALUES ($1, 'OPPORTUNITY', $2, $3, 'SCORE_RECALCULATED')`,
    [customerId, total, JSON.stringify(breakdown)]
  );

  return {
    opportunity_score: total,
    opportunity_breakdown: breakdown,
  };
}

// ─── Dimension 1: Protection Gap Severity (max 30) ────────────

function protectionGapSeverity(c: any): number {
  let score = 0;
  const noHealth = !c.health_cover;
  const noTerm = !c.term_cover;
  const noLife = !c.life_cover;

  // Missing health is the biggest gap
  if (noHealth) score += 10;

  // Missing term
  if (noTerm) {
    score += 8;
    // Bonus severity if dependents exist
    if ((c.dependents || 0) >= 1 || (c.children || 0) >= 1) score += 2;
  }

  // Missing life — reduced if health is also missing (health is the primary signal)
  if (noLife && !noHealth) {
    score += 6;
  } else if (noLife && noHealth) {
    score += 2;
  }

  // Missing motor
  if (!c.motor_cover) score += 4;

  // Single earner amplifier: gap is more severe
  if (c.single_earner && noHealth && noTerm) score += 2;

  return Math.min(score, 30);
}

// ─── Dimension 2: Renewal Urgency (max 25) ────────────────────

function renewalUrgency(c: any): number {
  const days = c.renewal_due_days ?? 999;
  if (days < 15) return 25;
  if (days < 30) return 18;
  if (days < 60) return 10;
  if (days < 120) return 5;
  return 0;
}

// ─── Dimension 3: Conversion Likelihood (max 20) ──────────────

function conversionLikelihood(c: any): number {
  let score = 0;

  // Recent interaction
  if ((c.last_interaction_days || 999) < 30) score += 5;

  // Existing PB customer
  if ((c.known_pb_policies || 0) >= 1) score += 5;

  // Renewal approaching
  if ((c.renewal_due_days ?? 999) < 30) score += 5;

  // Highest-converting cohort: married + dependents + renewal imminent + missing health
  if (
    c.marital_status === 'MARRIED' &&
    ((c.dependents || 0) >= 1 || (c.children || 0) >= 1) &&
    (c.renewal_due_days ?? 999) < 15 &&
    !c.health_cover
  ) {
    score += 5;
  }

  // Moderate cohort: married + dependents + engaged but no renewal urgency
  if (
    c.marital_status === 'MARRIED' &&
    ((c.dependents || 0) >= 1 || (c.children || 0) >= 1) &&
    (c.renewal_due_days ?? 999) >= 30 &&
    (c.renewal_due_days ?? 999) < 60 &&
    (c.known_pb_policies || 0) >= 2
  ) {
    score += 3;
  }

  return Math.min(score, 20);
}

// ─── Dimension 4: Revenue Potential (max 15) ──────────────────

function revenuePotential(c: any): number {
  // High: health cross-sell on imminent renewal
  if (!c.health_cover && (c.renewal_due_days ?? 999) < 30) return 12;

  // Medium-high: health gap, no renewal urgency but single earner
  if (!c.health_cover && c.single_earner) return 10;

  // Medium: health gap general
  if (!c.health_cover) return 10;

  // Term on dependent customer
  if (!c.term_cover && ((c.dependents || 0) >= 1 || (c.children || 0) >= 1)) return 8;

  return 5;
}

// ─── Dimension 5: Relationship Strength (max 10) ──────────────

function relationshipStrength(c: any): number {
  let score = 0;

  // Recent call/interaction
  if ((c.last_interaction_days || 999) < 30) score += 3;

  // Active PB customer
  if ((c.known_pb_policies || 0) >= 1) score += 3;

  // Multiple policies = deeper relationship
  if ((c.known_pb_policies || 0) >= 2) score += 2;

  // Profile complete = trust built
  if (c.profile_complete) score += 2;

  return Math.min(score, 10);
}
