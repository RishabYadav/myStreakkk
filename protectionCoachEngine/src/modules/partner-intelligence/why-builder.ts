import { PartnerLead } from './partner-intelligence.types';

export function buildWhyArray(lead: Omit<PartnerLead, 'why'>): string[] {
  const reasons: string[] = [];
  const days = lead.renewal_due_days;

  if (days !== null && days <= 14) {
    reasons.push(`Renewal is due in ${days} day${days === 1 ? '' : 's'}, creating an immediate outreach window`);
  } else if (days !== null && days <= 30) {
    reasons.push(`Renewal is approaching in ${days} days`);
  }

  const missingCoverage = [
    !lead.health_cover ? 'health' : null,
    !lead.term_cover ? 'term' : null,
    !lead.life_cover ? 'life' : null,
    !lead.motor_cover ? 'motor' : null,
  ].filter((product): product is string => product !== null);

  if (missingCoverage.length > 0) {
    reasons.push(`Missing ${formatList(missingCoverage)} coverage`);
  }

  if (lead.dependents > 0 && (!lead.health_cover || !lead.term_cover)) {
    reasons.push(
      `${lead.dependents} dependent${lead.dependents === 1 ? '' : 's'} increase the impact of the current protection gaps`
    );
  }

  if (lead.single_earner && lead.home_loan) {
    reasons.push('Sole earning member with a home loan outstanding');
  } else if (lead.single_earner) {
    reasons.push('Sole earning member for the household');
  } else if (lead.home_loan) {
    reasons.push('Home loan increases the need for income protection');
  }

  const conversion = lead.opportunity_breakdown?.conversion_likelihood ?? 0;
  if (conversion >= 15) {
    reasons.push('High conversion likelihood based on the stored opportunity signals');
  } else if (conversion >= 10) {
    reasons.push('Moderate conversion likelihood based on the stored opportunity signals');
  }

  if (
    reasons.length < 4 &&
    lead.last_interaction_days !== null &&
    lead.last_interaction_days < 30
  ) {
    reasons.push(`Recent customer interaction ${lead.last_interaction_days} days ago`);
  }

  if (reasons.length === 0) {
    reasons.push('Highest stored Opportunity Score in this partner portfolio');
  }

  return reasons.slice(0, 5);
}

function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
