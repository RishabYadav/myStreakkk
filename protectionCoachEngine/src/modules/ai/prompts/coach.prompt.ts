/**
 * AI Coach Prompt Strategy (Advisor-Facing)
 * 
 * The AI NEVER calculates scores. It receives pre-computed scores and
 * generates actionable advisor guidance.
 */

export function buildCoachSystemPrompt(context: string): string {
  return `You are an AI coach for insurance advisors at PBPartners.
You help advisors understand customer opportunity scores, identify upsell/cross-sell opportunities, and plan outreach.

IMPORTANT RULES:
- You NEVER calculate or recalculate scores. All scores are pre-computed.
- Be data-driven and action-oriented. Advisors want specific guidance.
- Prioritize high-impact actions first.
- Suggest specific products with reasoning.
- Provide conversation starters and objection handlers.
- Reference renewal dates and timing for outreach.
- Be concise. Advisors are busy.
- Format as bullet points and numbered lists.

CUSTOMER DATA & SCORES:
${context}`;
}

export function buildAdvisorContext(
  customer: any,
  pis: any,
  os: any,
  recommendations: any[]
): string {
  return `
CUSTOMER PROFILE:
- Name: ${customer.first_name} ${customer.last_name}
- Age: ${calcAge(customer.date_of_birth)}
- Life Stage: ${customer.life_stage}
- Marital Status: ${customer.marital_status || 'Unknown'}
- Dependents: ${customer.dependents || 0} | Children: ${customer.children || 0}
- Annual Income: ₹${formatNum(customer.annual_income)}
- Occupation: ${customer.occupation || 'Unknown'}
- Single Earner: ${customer.single_earner ? 'Yes' : 'No'}
- Home Loan: ${customer.home_loan ? 'Yes (₹' + formatNum(customer.existing_liabilities) + ')' : 'No'}
- Smoker: ${customer.smoker ? 'Yes' : 'No'}
- Last Interaction: ${customer.last_interaction_days} days ago
- Renewal Due: ${customer.renewal_due_days !== null ? customer.renewal_due_days + ' days' : 'Unknown'}

COVERAGE:
- Health: ${customer.health_cover ? '✓' : '✗'}
- Term: ${customer.term_cover ? '✓' : '✗'}
- Life: ${customer.life_cover ? '✓' : '✗'}
- Motor: ${customer.motor_cover ? '✓' : '✗'}
- External Policies: ${customer.external_policies || 0}

PROTECTION SCORE (Customer View): ${pis?.protection_intelligence_score || 'N/A'}/100
${pis?.score_breakdown ? Object.entries(pis.score_breakdown).map(([k, v]: [string, any]) => `  ${k.replace(/_/g, ' ')}: ${v.score}/${v.max}`).join('\n') : ''}

OPPORTUNITY SCORE (Agent View): ${os?.opportunity_score || 'N/A'}/100
${os?.opportunity_breakdown ? Object.entries(os.opportunity_breakdown).map(([k, v]: [string, any]) => `  ${k.replace(/_/g, ' ')}: ${v}`).join('\n') : ''}

PROTECTION GAPS: ${pis?.weak_spots?.join(', ') || 'None'}

TOP RECOMMENDATIONS:
${recommendations.map((r, i) => `  ${i + 1}. ${r.title} (${r.urgency} urgency)`).join('\n')}
`.trim();
}

function calcAge(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const bd = new Date(dob);
  let age = today.getFullYear() - bd.getFullYear();
  if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
  return age;
}

function formatNum(n: any): string {
  if (!n) return '0';
  return Number(n).toLocaleString('en-IN');
}
