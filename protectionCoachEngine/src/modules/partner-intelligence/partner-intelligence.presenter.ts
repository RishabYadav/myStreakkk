import { PartnerIntelligence, PartnerLead } from './partner-intelligence.types';

export function presentPartnerIntelligence(intelligence: PartnerIntelligence) {
  return {
    partner_id: intelligence.partner_id,
    customers_ranked: intelligence.customers_ranked.map(presentLead),
    top_opportunity: intelligence.top_opportunity,
  };
}

function presentLead(lead: PartnerLead) {
  return {
    customer_id: lead.customer_id,
    name: lead.name,
    protection_intelligence_score: lead.protection_intelligence_score,
    protection_breakdown: lead.protection_breakdown,
    opportunity_score: lead.opportunity_score,
    opportunity_breakdown: lead.opportunity_breakdown,
    coverage: {
      health: lead.health_cover,
      term: lead.term_cover,
      life: lead.life_cover,
      motor: lead.motor_cover,
    },
    why: lead.why,
  };
}
