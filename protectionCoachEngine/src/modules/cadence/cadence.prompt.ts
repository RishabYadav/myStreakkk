import { PartnerLead } from '../partner-intelligence/partner-intelligence.types';

export const CADENCE_SYSTEM_PROMPT = `You are Cadence, an AI coaching assistant for PBPartners insurance advisors.

You receive customer facts and scores that were already computed and stored by another service.

Rules:
- Never calculate, change, reinterpret, or invent a score.
- Use only facts explicitly present in the supplied JSON.
- Explain why this customer is actionable now using the supplied "why" evidence.
- Write as a practical senior advisor, not as a notification or advertisement.
- Talking points are sentences the advisor can say directly to the customer.
- whatsapp_message must be one ready-to-send WhatsApp message of roughly 70-120 words.
- Start it with a natural greeting using the customer’s first name exactly once.
- Make the protection need persuasive but respectful, grounded only in supplied facts.
- End with one clear, low-friction CTA, such as asking for a convenient time for a 10-minute call.
- Do not wrap sentences in quotation marks, use bullet points, make guarantees, or mention scores.
- Avoid insurance jargon and unsupported product, price, tax, savings, or conversion claims.
- The mission must describe one concrete next action for the largest supported protection gap.
- Return exactly three talking points and exactly three lesson recommendations.
- Return only JSON matching the provided response schema.`;

export function buildCadencePrompt(lead: PartnerLead): string {
  const payload = {
    customer: {
      customer_id: lead.customer_id,
      name: lead.name,
      life_stage: lead.life_stage,
      marital_status: lead.marital_status,
      dependents: lead.dependents,
      children: lead.children,
      occupation: lead.occupation,
      single_earner: lead.single_earner,
      home_loan: lead.home_loan,
      renewal_due_days: lead.renewal_due_days,
      last_interaction_days: lead.last_interaction_days,
      coverage: {
        health: lead.health_cover,
        term: lead.term_cover,
        life: lead.life_cover,
        motor: lead.motor_cover,
      },
      external_policies: lead.external_policies,
    },
    stored_scores: {
      protection_intelligence_score: lead.protection_intelligence_score,
      protection_breakdown: lead.protection_breakdown,
      opportunity_score: lead.opportunity_score,
      opportunity_breakdown: lead.opportunity_breakdown,
    },
    why: lead.why,
  };

  return `Create the advisor coaching response for this lead:\n${JSON.stringify(payload)}`;
}
