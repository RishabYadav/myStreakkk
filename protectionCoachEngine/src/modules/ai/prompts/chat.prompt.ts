/**
 * AI Chat Prompt Strategy
 * 
 * The AI NEVER calculates scores. Scores are pre-computed by the engines.
 * The AI receives scores + context and generates human-readable advice.
 */

export function buildChatSystemPrompt(context: string): string {
  return `You are a friendly, knowledgeable insurance protection advisor AI called "Protection Coach."
You help customers understand their insurance coverage and protection score.

IMPORTANT RULES:
- You NEVER calculate or recalculate scores. Scores are pre-computed and given to you.
- You explain what the scores mean and how to improve them.
- You speak in simple, conversational language. No jargon.
- Use ₹ for currency amounts.
- Be empathetic. Insurance is confusing and people feel vulnerable discussing it.
- Give specific, actionable advice based on the customer's actual data.
- Never guarantee outcomes or returns.
- If asked about something outside insurance/protection, politely redirect.
- Keep responses under 150 words unless the user asks for detail.
- Use bullet points for action items.

CUSTOMER CONTEXT (this is real data, reference it directly):
${context}`;
}

export function buildCustomerContext(customer: any, pis: any, recommendations: any[]): string {
  const gaps = pis?.weak_spots || [];
  const topGap = pis?.top_gap || 'none';

  return `
NAME: ${customer.first_name} ${customer.last_name}
AGE: ${calcAge(customer.date_of_birth)}
LIFE STAGE: ${customer.life_stage}
MARITAL STATUS: ${customer.marital_status || 'Unknown'}
DEPENDENTS: ${customer.dependents || 0}
CHILDREN: ${customer.children || 0}
ANNUAL INCOME: ₹${formatNum(customer.annual_income)}
OCCUPATION: ${customer.occupation || 'Not specified'}
SINGLE EARNER: ${customer.single_earner ? 'Yes' : 'No'}
HOME LOAN: ${customer.home_loan ? 'Yes' : 'No'}

COVERAGE STATUS:
- Health: ${customer.health_cover ? '✓ Covered' : '✗ NOT covered'}
- Term Life: ${customer.term_cover ? '✓ Covered' : '✗ NOT covered'}
- Life: ${customer.life_cover ? '✓ Covered' : '✗ NOT covered'}
- Motor: ${customer.motor_cover ? '✓ Covered' : '✗ NOT covered'}

PROTECTION SCORE: ${pis?.protection_intelligence_score || 'Not calculated'}/100
SCORE BREAKDOWN:
${pis?.score_breakdown ? Object.entries(pis.score_breakdown).map(([k, v]: [string, any]) => `  - ${k.replace(/_/g, ' ')}: ${v.score}/${v.max}`).join('\n') : 'Not available'}

TOP GAP: ${topGap}
ALL GAPS: ${gaps.length > 0 ? gaps.join(', ') : 'None — well protected!'}

TOP RECOMMENDATION: ${recommendations.length > 0 ? recommendations[0].title : 'None'}
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
  if (!n) return 'Not provided';
  return Number(n).toLocaleString('en-IN');
}
