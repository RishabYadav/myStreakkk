import pool from '../../../config/database';
import { calculateProtectionScore } from './protection-score.engine';

/**
 * Future Risk Simulation Engine
 * 
 * Simulates life events and projects how they'd change the customer's
 * protection score, reveal new gaps, and what actions to take.
 *
 * Supported scenarios:
 * - marriage
 * - child_birth
 * - home_purchase
 * - salary_increase
 * - new_dependent
 * - retirement_planning
 */

export interface SimulationInput {
  customer_id: string;
  scenario: string;
  params?: Record<string, any>;
}

export interface SimulationResult {
  scenario: string;
  scenario_label: string;
  current_score: number;
  projected_score: number;
  score_change: number;
  new_gaps: string[];
  risk_factors: string[];
  recommended_actions: RecommendedAction[];
  projected_breakdown: Record<string, { score: number; max: number; change: number }>;
}

interface RecommendedAction {
  priority: number;
  action: string;
  product?: string;
  reason: string;
  impact: string;
}

// Scenario definitions: how each life event modifies customer attributes
const SCENARIO_MODIFIERS: Record<string, {
  label: string;
  modify: (customer: any, params?: Record<string, any>) => any;
  risks: string[];
}> = {
  marriage: {
    label: 'Getting Married',
    modify: (c, _params) => ({
      ...c,
      marital_status: 'MARRIED',
      dependents: Math.max((c.dependents || 0), 1),
    }),
    risks: [
      'Spouse becomes financial dependent',
      'Joint financial obligations increase',
      'Need for combined health coverage',
    ],
  },
  child_birth: {
    label: 'Having a Child',
    modify: (c, _params) => ({
      ...c,
      children: (c.children || 0) + 1,
      dependents: (c.dependents || 0) + 1,
    }),
    risks: [
      'New dependent with 20+ year financial commitment',
      'Education fund requirement (₹30-50 lakhs)',
      'Increased healthcare needs',
      'Single earner vulnerability amplified',
    ],
  },
  home_purchase: {
    label: 'Buying a Home',
    modify: (c, params) => ({
      ...c,
      home_loan: true,
      existing_liabilities: (parseFloat(c.existing_liabilities) || 0) + (params?.loan_amount || 5000000),
    }),
    risks: [
      'Large EMI burden for 15-20 years',
      'Family displacement risk if earner unable to pay',
      'Property-related liabilities',
    ],
  },
  salary_increase: {
    label: 'Salary Increase',
    modify: (c, params) => ({
      ...c,
      annual_income: (parseFloat(c.annual_income) || 500000) * (params?.multiplier || 1.5),
    }),
    risks: [
      'Coverage adequacy gap widens (need 10x new income)',
      'Lifestyle inflation creates larger protection need',
      'Tax planning opportunity with insurance products',
    ],
  },
  new_dependent: {
    label: 'New Dependent (Elderly Parent)',
    modify: (c, _params) => ({
      ...c,
      elderly_parent_dependent: true,
      dependents: (c.dependents || 0) + 1,
    }),
    risks: [
      'Elderly healthcare costs (₹5-15 lakhs/year potential)',
      'Additional financial responsibility',
      'Long-term care planning needed',
    ],
  },
  retirement_planning: {
    label: 'Planning for Retirement',
    modify: (c, params) => ({
      ...c,
      life_stage: 'PRE_RETIREMENT',
      single_earner: true, // Income will stop
      annual_income: (parseFloat(c.annual_income) || 500000) * (params?.corpus_ratio || 0.4),
    }),
    risks: [
      'Income will cease — coverage must outlast earning years',
      'Healthcare costs peak in retirement',
      'Existing policies may expire before needed',
      'Need guaranteed income products',
    ],
  },
};

export async function runSimulation(input: SimulationInput): Promise<SimulationResult> {
  const { customer_id, scenario, params } = input;

  const scenarioDef = SCENARIO_MODIFIERS[scenario];
  if (!scenarioDef) {
    throw new Error(`Unknown scenario: ${scenario}. Supported: ${Object.keys(SCENARIO_MODIFIERS).join(', ')}`);
  }

  // Get current customer
  const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customer_id])).rows[0];
  if (!customer) throw new Error(`Customer ${customer_id} not found`);

  // Calculate current score
  const currentResult = await calculateProtectionScore(customer_id);
  const currentScore = currentResult.protection_intelligence_score;
  const currentBreakdown = currentResult.score_breakdown;

  // Simulate: modify customer attributes
  const simulatedCustomer = scenarioDef.modify(customer, params);

  // Calculate projected score with simulated attributes (in-memory, not saved)
  const projectedBreakdown = calculateProjectedBreakdown(simulatedCustomer);
  const projectedScore = Object.values(projectedBreakdown).reduce((sum, d) => sum + d.score, 0);

  // Determine new gaps
  const currentGaps = currentResult.weak_spots;
  const projectedGaps = getProjectedGaps(simulatedCustomer, scenario);

  // Build recommended actions
  const actions = buildRecommendedActions(simulatedCustomer, scenario, projectedGaps);

  // Build breakdown with changes
  const breakdownWithChanges: Record<string, { score: number; max: number; change: number }> = {};
  for (const [key, value] of Object.entries(projectedBreakdown)) {
    const currentVal = (currentBreakdown as any)[key]?.score || 0;
    breakdownWithChanges[key] = {
      score: value.score,
      max: value.max,
      change: value.score - currentVal,
    };
  }

  // Persist simulation result
  await pool.query(
    `INSERT INTO risk_simulations (customer_id, scenario_name, scenario_params, status, 
     projected_protection_score, projected_dimensions, recommendations, risk_factors, completed_at)
     VALUES ($1, $2, $3, 'COMPLETED', $4, $5, $6, $7, NOW())`,
    [
      customer_id, scenario, JSON.stringify(params || {}),
      projectedScore, JSON.stringify(breakdownWithChanges),
      JSON.stringify(actions), JSON.stringify(scenarioDef.risks),
    ]
  );

  return {
    scenario,
    scenario_label: scenarioDef.label,
    current_score: currentScore,
    projected_score: projectedScore,
    score_change: projectedScore - currentScore,
    new_gaps: projectedGaps,
    risk_factors: scenarioDef.risks,
    recommended_actions: actions,
    projected_breakdown: breakdownWithChanges,
  };
}

// ─── Internal helpers ─────────────────────────────────────────

function calculateProjectedBreakdown(c: any): Record<string, { score: number; max: number }> {
  return {
    coverage_adequacy: { score: calcCA(c), max: 30 },
    life_stage_readiness: { score: calcLSR(c), max: 15 },
    financial_vulnerability: { score: calcFV(c), max: 15 },
    family_risk_protection: { score: calcFRP(c), max: 10 },
    protection_freshness: { score: calcPF(c), max: 10 },
    engagement_strength: { score: calcES(c), max: 10 },
    data_confidence: { score: calcDC(c), max: 10 },
  };
}

function calcCA(c: any): number {
  let s = 0;
  if (c.health_cover) s += 10;
  if (c.term_cover) s += 8;
  if (c.life_cover) s += 7;
  if (c.motor_cover) s += 3;
  if ((c.external_policies || 0) >= 1) s += 2;
  return Math.min(s, 30);
}

function calcLSR(c: any): number {
  let s = 0;
  const age = c.date_of_birth ? calcAge(c.date_of_birth) : 30;
  if (c.health_cover && age >= 25) s += 5;
  if (c.marital_status === 'MARRIED' && (c.health_cover || c.life_cover)) s += 4;
  if ((c.dependents || 0) >= 1 && (c.term_cover || c.life_cover)) s += 6;
  if (c.marital_status === 'MARRIED' && (c.children || 0) >= 1 && c.motor_cover) s += 2;
  return Math.min(s, 15);
}

function calcFV(c: any): number {
  let s = 0;
  if (c.home_loan && (c.term_cover || c.life_cover)) s += 5;
  if (c.single_earner && (c.health_cover || c.term_cover)) s += 5;
  if (c.single_earner && c.term_cover) s += 5;
  if (c.home_loan && c.motor_cover && !c.term_cover && !c.life_cover) s += 3;
  if (c.single_earner && !c.health_cover && !c.term_cover && c.motor_cover) s += 2;
  return Math.min(s, 15);
}

function calcFRP(c: any): number {
  let s = 0;
  if ((c.children || 0) >= 1 && c.term_cover) s += 5;
  if (c.elderly_parent_dependent && (c.health_cover || c.life_cover)) s += 5;
  if ((c.children || 0) >= 1 && !c.term_cover && c.motor_cover) s += 2;
  return Math.min(s, 10);
}

function calcPF(c: any): number {
  let s = 5;
  if (c.renewal_due_days !== null && c.renewal_due_days !== undefined) s += 5;
  return Math.min(s, 10);
}

function calcES(c: any): number {
  let s = 0;
  if ((c.last_interaction_days || 999) < 30) s += 4;
  if ((c.known_pb_policies || 0) >= 1) s += 3;
  if (c.profile_complete) s += 3;
  return Math.min(s, 10);
}

function calcDC(c: any): number {
  let s = 0;
  if ((c.known_pb_policies || 0) >= 2) s += 3;
  if ((c.external_policies || 0) >= 1) s += 4;
  if (c.profile_complete) s += 3;
  return Math.min(s, 10);
}

function calcAge(dob: string | Date): number {
  const today = new Date();
  const bd = new Date(dob);
  let age = today.getFullYear() - bd.getFullYear();
  if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
  return age;
}

function getProjectedGaps(c: any, scenario: string): string[] {
  const gaps: string[] = [];
  if (!c.health_cover) gaps.push('health');
  if (!c.term_cover) gaps.push('term');
  if (!c.life_cover) gaps.push('life');

  // Scenario-specific gaps
  if (scenario === 'child_birth' && !c.term_cover) gaps.push('child_education_fund');
  if (scenario === 'home_purchase' && !c.term_cover) gaps.push('loan_protection');
  if (scenario === 'retirement_planning' && !c.health_cover) gaps.push('retirement_health');
  if (scenario === 'new_dependent' && !c.health_cover) gaps.push('elderly_care');

  return [...new Set(gaps)];
}

function buildRecommendedActions(c: any, scenario: string, gaps: string[]): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  let priority = 1;

  if (gaps.includes('health')) {
    actions.push({
      priority: priority++,
      action: 'Buy health insurance immediately',
      product: 'health',
      reason: scenario === 'child_birth'
        ? 'Newborn and mother need immediate health coverage'
        : scenario === 'new_dependent'
        ? 'Elderly parent healthcare costs can be catastrophic without cover'
        : 'Health insurance becomes critical with increased financial responsibilities',
      impact: '+10 to Protection Score',
    });
  }

  if (gaps.includes('term')) {
    actions.push({
      priority: priority++,
      action: 'Get term life insurance',
      product: 'term',
      reason: scenario === 'child_birth'
        ? `Secure ₹${Math.round(((parseFloat(c.annual_income) || 500000) * 15) / 100000)} lakhs to cover child's future until independence`
        : scenario === 'home_purchase'
        ? 'Term plan should cover outstanding home loan amount at minimum'
        : 'Term insurance ensures dependents maintain lifestyle if something happens',
      impact: '+8 to +15 to Protection Score',
    });
  }

  if (scenario === 'home_purchase') {
    actions.push({
      priority: priority++,
      action: 'Get home loan protection plan',
      product: 'term',
      reason: 'Ensures EMI payments continue and family keeps the home',
      impact: '+5 to Financial Vulnerability dimension',
    });
  }

  if (scenario === 'salary_increase') {
    actions.push({
      priority: priority++,
      action: 'Increase sum assured to match new income',
      product: 'term',
      reason: 'Coverage should be 10x annual income. Higher salary = higher coverage needed.',
      impact: 'Maintains Coverage Adequacy ratio',
    });
  }

  if (scenario === 'retirement_planning') {
    actions.push({
      priority: priority++,
      action: 'Convert to comprehensive health plan with lifetime renewal',
      product: 'health',
      reason: 'Employer health cover will stop at retirement. Lock in lifetime plan now.',
      impact: 'Prevents coverage lapse in retirement',
    });
  }

  return actions;
}
