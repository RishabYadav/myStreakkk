import pool from '../../../config/database';

/**
 * Protection Intelligence Score (PIS)
 * Customer lens. 100-point score. Seven dimensions summing to 100.
 * Every point traces back to a specific customer attribute. Pure formula.
 *
 * Dimensions & max weights:
 *   Coverage Adequacy:       30
 *   Life Stage Readiness:    15
 *   Financial Vulnerability: 15
 *   Family Risk Protection:  10
 *   Protection Freshness:    10
 *   Engagement Strength:     10
 *   Data Confidence:         10
 *   TOTAL:                  100
 */

export async function calculateProtectionScore(customerId: string) {
  const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])).rows[0];
  if (!customer) throw new Error(`Customer ${customerId} not found`);

  const ca = coverageAdequacy(customer);
  const lsr = lifeStageReadiness(customer);
  const fv = financialVulnerability(customer);
  const frp = familyRiskProtection(customer);
  const pf = protectionFreshness(customer);
  const es = engagementStrength(customer);
  const dc = dataConfidence(customer);

  const total = ca + lsr + fv + frp + pf + es + dc;

  const breakdown = {
    coverage_adequacy: { score: ca, max: 30 },
    life_stage_readiness: { score: lsr, max: 15 },
    financial_vulnerability: { score: fv, max: 15 },
    family_risk_protection: { score: frp, max: 10 },
    protection_freshness: { score: pf, max: 10 },
    engagement_strength: { score: es, max: 10 },
    data_confidence: { score: dc, max: 10 },
  };

  const coverage = {
    motor: { covered: !!customer.motor_cover, source: customer.coverage_source?.motor || null },
    life: { covered: !!customer.life_cover, source: customer.coverage_source?.life || null },
    health: { covered: !!customer.health_cover, source: customer.coverage_source?.health || null },
    term: { covered: !!customer.term_cover, source: customer.coverage_source?.term || null },
  };

  const weakSpots = getWeakSpots(customer);
  const topGap = weakSpots.length > 0 ? weakSpots[0] : 'none';

  // Upsert protection score in DB
  const upsertQuery = `
    INSERT INTO protection_scores (
      customer_id, overall_score, coverage_adequacy, life_stage_readiness,
      financial_vulnerability, family_risk_protection, protection_freshness,
      engagement_strength, data_confidence, weights, calculated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
    ON CONFLICT (customer_id) DO UPDATE SET
      overall_score = $2, coverage_adequacy = $3, life_stage_readiness = $4,
      financial_vulnerability = $5, family_risk_protection = $6, protection_freshness = $7,
      engagement_strength = $8, data_confidence = $9, weights = $10, calculated_at = NOW()
    RETURNING *
  `;

  await pool.query(upsertQuery, [
    customerId, total,
    ca, lsr, fv, frp, pf, es, dc,
    JSON.stringify(breakdown),
  ]);

  // Save to history
  await pool.query(
    `INSERT INTO score_histories (customer_id, score_type, overall_score, dimensions, triggered_by)
     VALUES ($1, 'PROTECTION', $2, $3, 'SCORE_RECALCULATED')`,
    [customerId, total, JSON.stringify(breakdown)]
  );

  return {
    protection_intelligence_score: total,
    score_breakdown: breakdown,
    coverage,
    weak_spots: weakSpots,
    top_gap: topGap,
  };
}

// ─── Dimension 1: Coverage Adequacy (max 30) ──────────────────

function coverageAdequacy(c: any): number {
  let score = 0;
  if (c.health_cover) score += 10;
  if (c.term_cover) score += 8;
  if (c.life_cover) score += 7;
  if (c.motor_cover) score += 3;
  if ((c.external_policies || 0) >= 1) score += 2;
  return Math.min(score, 30);
}

// ─── Dimension 2: Life Stage Readiness (max 15) ───────────────

function lifeStageReadiness(c: any): number {
  let score = 0;
  const age = c.date_of_birth ? calculateAge(c.date_of_birth) : 0;

  // Age-appropriate health cover
  if (c.health_cover && age >= 25) score += 5;

  // Married + protection present
  if (c.marital_status === 'MARRIED' && (c.health_cover || c.life_cover)) score += 4;

  // Dependents protected
  if ((c.dependents || 0) >= 1 && (c.term_cover || c.life_cover)) score += 6;

  // Bonus: Married with children shows life-stage awareness even without optimal coverage
  if (c.marital_status === 'MARRIED' && (c.children || 0) >= 1 && c.motor_cover) score += 2;

  return Math.min(score, 15);
}

// ─── Dimension 3: Financial Vulnerability (max 15) ────────────

function financialVulnerability(c: any): number {
  let score = 0;

  // Home loan protected
  if (c.home_loan && (c.term_cover || c.life_cover)) score += 5;

  // Income protection need met
  if (c.single_earner && (c.health_cover || c.term_cover)) score += 5;

  // Single earner with term = fully protected
  if (c.single_earner && c.term_cover) score += 5;

  // Partial credit: home loan awareness (has loan, recognizes risk via any coverage)
  if (c.home_loan && c.motor_cover && !c.term_cover && !c.life_cover) score += 3;

  // Partial credit: single earner with some coverage awareness
  if (c.single_earner && !c.health_cover && !c.term_cover && c.motor_cover) score += 2;

  return Math.min(score, 15);
}

// ─── Dimension 4: Family Risk Protection (max 10) ─────────────

function familyRiskProtection(c: any): number {
  let score = 0;

  // Child dependency protected by term
  if ((c.children || 0) >= 1 && c.term_cover) score += 5;

  // Elderly parent dependency protected
  if (c.elderly_parent_dependent && (c.health_cover || c.life_cover)) score += 5;

  // Partial credit: has dependents and at least motor (shows some responsibility)
  if ((c.children || 0) >= 1 && !c.term_cover && c.motor_cover) score += 2;

  return Math.min(score, 10);
}

// ─── Dimension 5: Protection Freshness (max 10) ───────────────

function protectionFreshness(c: any): number {
  let score = 0;

  // No lapsed policies
  score += 5;

  // Renewal visibility (renewal date is tracked)
  if (c.renewal_due_days !== null && c.renewal_due_days !== undefined) score += 5;

  return Math.min(score, 10);
}

// ─── Dimension 6: Engagement Strength (max 10) ────────────────

function engagementStrength(c: any): number {
  let score = 0;

  // Recent interaction
  if ((c.last_interaction_days || 999) < 30) score += 4;

  // Active PB customer
  if ((c.known_pb_policies || 0) >= 1) score += 3;

  // Profile complete
  if (c.profile_complete) score += 3;

  return Math.min(score, 10);
}

// ─── Dimension 7: Data Confidence (max 10) ────────────────────

function dataConfidence(c: any): number {
  let score = 0;

  // Multiple PB policies known
  if ((c.known_pb_policies || 0) >= 2) score += 3;

  // External policies captured
  if ((c.external_policies || 0) >= 1) score += 4;

  // Profile data verified
  if (c.profile_complete) score += 3;

  return Math.min(score, 10);
}

// ─── Helpers ──────────────────────────────────────────────────

function getWeakSpots(c: any): string[] {
  const gaps: string[] = [];
  if (!c.health_cover) gaps.push('health');
  if (!c.term_cover) gaps.push('term');
  if (!c.life_cover) gaps.push('life');
  return gaps;
}

function calculateAge(dob: string | Date): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
