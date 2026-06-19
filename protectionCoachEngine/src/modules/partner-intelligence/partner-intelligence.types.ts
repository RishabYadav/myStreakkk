export interface ScoreDimension {
  score: number;
  max: number;
}

export interface OpportunityBreakdown {
  protection_gap_severity: number;
  renewal_urgency: number;
  conversion_likelihood: number;
  revenue_potential: number;
  relationship_strength: number;
}

export interface ProtectionBreakdown {
  coverage_adequacy: ScoreDimension;
  life_stage_readiness: ScoreDimension;
  financial_vulnerability: ScoreDimension;
  family_risk_protection: ScoreDimension;
  protection_freshness: ScoreDimension;
  engagement_strength: ScoreDimension;
  data_confidence: ScoreDimension;
}

export interface PartnerLead {
  internal_customer_id: string;
  customer_id: string;
  partner_id: string;
  name: string;
  date_of_birth: string | Date;
  life_stage: string;
  marital_status: string | null;
  dependents: number;
  children: number;
  annual_income: number | null;
  occupation: string | null;
  existing_liabilities: number | null;
  health_cover: boolean;
  term_cover: boolean;
  life_cover: boolean;
  motor_cover: boolean;
  external_policies: number;
  single_earner: boolean;
  home_loan: boolean;
  renewal_due_days: number | null;
  last_interaction_days: number | null;
  known_pb_policies: number;
  profile_complete: boolean;
  protection_intelligence_score: number | null;
  protection_breakdown: ProtectionBreakdown | null;
  protection_score_calculated_at: Date | null;
  opportunity_score: number | null;
  opportunity_breakdown: OpportunityBreakdown | null;
  opportunity_score_calculated_at: Date | null;
  why: string[];
}

export interface PartnerIntelligence {
  partner_id: string;
  customers_ranked: PartnerLead[];
  top_opportunity: string;
}
