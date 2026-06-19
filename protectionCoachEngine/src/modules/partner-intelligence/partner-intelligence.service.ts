import { HttpError } from '../../shared/errors/http-error';
import { findPartnerLead, findPartnerLeads } from './partner-intelligence.repository';
import { PartnerIntelligence, PartnerLead } from './partner-intelligence.types';

export async function getPartnerIntelligence(partnerId: string): Promise<PartnerIntelligence> {
  const leads = await findPartnerLeads(partnerId);
  assertPartnerHasScoredLeads(partnerId, leads);

  const ranked = leads.filter((lead) => lead.opportunity_score !== null);
  return {
    partner_id: partnerId,
    customers_ranked: ranked,
    top_opportunity: ranked[0].customer_id,
  };
}

export async function getActionableLead(
  partnerId: string,
  customerId?: string
): Promise<PartnerLead> {
  if (customerId) {
    const lead = await findPartnerLead(partnerId, customerId);
    if (!lead) {
      throw new HttpError(404, `Customer ${customerId} was not found for partner ${partnerId}`);
    }
    if (lead.opportunity_score === null) {
      throw new HttpError(409, `Customer ${customerId} does not have a stored Opportunity Score`);
    }
    return lead;
  }

  const intelligence = await getPartnerIntelligence(partnerId);
  return intelligence.customers_ranked[0];
}

function assertPartnerHasScoredLeads(partnerId: string, leads: PartnerLead[]): void {
  if (leads.length === 0) {
    throw new HttpError(404, `Partner ${partnerId} was not found or has no customers`);
  }
  if (!leads.some((lead) => lead.opportunity_score !== null)) {
    throw new HttpError(409, `Partner ${partnerId} has no stored Opportunity Scores`);
  }
}
