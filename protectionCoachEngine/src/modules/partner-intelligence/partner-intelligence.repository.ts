import pool from '../../config/database';
import {
  OpportunityBreakdown,
  PartnerLead,
  ProtectionBreakdown,
} from './partner-intelligence.types';
import { buildWhyArray } from './why-builder';

interface LeadRow {
  id: string;
  external_id: string | null;
  partner_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | Date;
  life_stage: string;
  marital_status: string | null;
  dependents: number | string | null;
  children: number | string | null;
  annual_income: number | string | null;
  occupation: string | null;
  existing_liabilities: number | string | null;
  health_cover: boolean;
  term_cover: boolean;
  life_cover: boolean;
  motor_cover: boolean;
  external_policies: number | string | null;
  single_earner: boolean;
  home_loan: boolean;
  renewal_due_days: number | string | null;
  last_interaction_days: number | string | null;
  known_pb_policies: number | string | null;
  profile_complete: boolean;
  protection_score: number | string | null;
  coverage_adequacy: number | string | null;
  life_stage_readiness: number | string | null;
  financial_vulnerability: number | string | null;
  family_risk_protection: number | string | null;
  protection_freshness: number | string | null;
  engagement_strength: number | string | null;
  data_confidence: number | string | null;
  protection_score_calculated_at: Date | null;
  opportunity_score: number | string | null;
  protection_gap_severity: number | string | null;
  renewal_urgency: number | string | null;
  conversion_likelihood: number | string | null;
  revenue_potential: number | string | null;
  relationship_strength: number | string | null;
  opportunity_score_calculated_at: Date | null;
}

const LEAD_SELECT = `
  SELECT
    c.id,
    c.external_id,
    c.partner_id,
    c.first_name,
    c.last_name,
    c.date_of_birth,
    c.life_stage,
    c.marital_status,
    c.dependents,
    c.children,
    c.annual_income,
    c.occupation,
    c.existing_liabilities,
    c.health_cover,
    c.term_cover,
    c.life_cover,
    c.motor_cover,
    c.external_policies,
    c.single_earner,
    c.home_loan,
    c.renewal_due_days,
    c.last_interaction_days,
    c.known_pb_policies,
    c.profile_complete,
    ps.overall_score AS protection_score,
    ps.coverage_adequacy,
    ps.life_stage_readiness,
    ps.financial_vulnerability,
    ps.family_risk_protection,
    ps.protection_freshness,
    ps.engagement_strength,
    ps.data_confidence,
    ps.calculated_at AS protection_score_calculated_at,
    os.overall_score AS opportunity_score,
    os.protection_gap_severity,
    os.renewal_urgency,
    os.conversion_likelihood,
    os.revenue_potential,
    os.relationship_strength,
    os.calculated_at AS opportunity_score_calculated_at
  FROM customers c
  LEFT JOIN protection_scores ps ON ps.customer_id = c.id
  LEFT JOIN opportunity_scores os ON os.customer_id = c.id
`;

export async function findPartnerLeads(partnerId: string): Promise<PartnerLead[]> {
  const result = await pool.query<LeadRow>(
    `${LEAD_SELECT}
     WHERE c.partner_id = $1
     ORDER BY os.overall_score DESC NULLS LAST, c.created_at ASC`,
    [partnerId]
  );
  return result.rows.map(mapLeadRow);
}

export async function findPartnerLead(
  partnerId: string,
  customerId: string
): Promise<PartnerLead | null> {
  const result = await pool.query<LeadRow>(
    `${LEAD_SELECT}
     WHERE c.partner_id = $1
       AND (c.id::text = $2 OR c.external_id = $2)
     LIMIT 1`,
    [partnerId, customerId]
  );
  return result.rows[0] ? mapLeadRow(result.rows[0]) : null;
}

function mapLeadRow(row: LeadRow): PartnerLead {
  const opportunityScore = nullableNumber(row.opportunity_score);
  const protectionScore = nullableNumber(row.protection_score);

  const opportunityBreakdown: OpportunityBreakdown | null =
    opportunityScore === null
      ? null
      : {
          protection_gap_severity: numberOrZero(row.protection_gap_severity),
          renewal_urgency: numberOrZero(row.renewal_urgency),
          conversion_likelihood: numberOrZero(row.conversion_likelihood),
          revenue_potential: numberOrZero(row.revenue_potential),
          relationship_strength: numberOrZero(row.relationship_strength),
        };

  const protectionBreakdown: ProtectionBreakdown | null =
    protectionScore === null
      ? null
      : {
          coverage_adequacy: { score: numberOrZero(row.coverage_adequacy), max: 30 },
          life_stage_readiness: { score: numberOrZero(row.life_stage_readiness), max: 15 },
          financial_vulnerability: {
            score: numberOrZero(row.financial_vulnerability),
            max: 15,
          },
          family_risk_protection: {
            score: numberOrZero(row.family_risk_protection),
            max: 10,
          },
          protection_freshness: { score: numberOrZero(row.protection_freshness), max: 10 },
          engagement_strength: { score: numberOrZero(row.engagement_strength), max: 10 },
          data_confidence: { score: numberOrZero(row.data_confidence), max: 10 },
        };

  const leadWithoutWhy: Omit<PartnerLead, 'why'> = {
    internal_customer_id: row.id,
    customer_id: row.external_id || row.id,
    partner_id: row.partner_id,
    name: `${row.first_name} ${row.last_name}`,
    date_of_birth: row.date_of_birth,
    life_stage: row.life_stage,
    marital_status: row.marital_status,
    dependents: numberOrZero(row.dependents),
    children: numberOrZero(row.children),
    annual_income: nullableNumber(row.annual_income),
    occupation: row.occupation,
    existing_liabilities: nullableNumber(row.existing_liabilities),
    health_cover: !!row.health_cover,
    term_cover: !!row.term_cover,
    life_cover: !!row.life_cover,
    motor_cover: !!row.motor_cover,
    external_policies: numberOrZero(row.external_policies),
    single_earner: !!row.single_earner,
    home_loan: !!row.home_loan,
    renewal_due_days: nullableNumber(row.renewal_due_days),
    last_interaction_days: nullableNumber(row.last_interaction_days),
    known_pb_policies: numberOrZero(row.known_pb_policies),
    profile_complete: !!row.profile_complete,
    protection_intelligence_score: protectionScore,
    protection_breakdown: protectionBreakdown,
    protection_score_calculated_at: row.protection_score_calculated_at,
    opportunity_score: opportunityScore,
    opportunity_breakdown: opportunityBreakdown,
    opportunity_score_calculated_at: row.opportunity_score_calculated_at,
  };

  return { ...leadWithoutWhy, why: buildWhyArray(leadWithoutWhy) };
}

function nullableNumber(value: number | string | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberOrZero(value: number | string | null): number {
  return nullableNumber(value) ?? 0;
}
