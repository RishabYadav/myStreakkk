import pool from '../../config/database';
import { generateResponse } from '../ai/gemini.client';
import { calculateProtectionScore } from './engines/protection-score.engine';
import { calculateOpportunityScore } from './engines/opportunity-score.engine';

/**
 * AI Insights Generator
 *
 * Generates and caches AI-produced recommendations, whyOpportunity prose,
 * talking points, and lesson items for a customer.
 *
 * WHEN it runs:
 *   - On customer creation (seed/insert)
 *   - After any coverage/policy change event (post score-recalculation)
 *   - On manual trigger via API
 *
 * The output is cached in `customer_insights` table and served instantly
 * on subsequent reads. Only regenerated when data changes.
 */

export interface AiRecommendation {
  priority: number;
  product: string;
  title: string;
  message: string;
  advisor_pitch: string;
  impact: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface AiLessonItem {
  priority: boolean;
  icon: string;
  title: string;
  body: string;
}

export interface CustomerInsights {
  recommendations: AiRecommendation[];
  why_opportunity: string;
  customer_tip: string;
  talking_points: string[];
  lesson_recommendations: AiLessonItem[];
  pis_at_generation: number;
  os_at_generation: number;
  generated_at: string;
}

/**
 * Generate fresh AI insights for a customer and persist to DB.
 */
export async function generateAndCacheInsights(
  customerId: string,
  triggeredBy: string = 'MANUAL'
): Promise<CustomerInsights> {
  // 1. Fetch customer + scores
  const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])).rows[0];
  if (!customer) throw new Error(`Customer ${customerId} not found`);

  const pis = await calculateProtectionScore(customerId);
  const os = await calculateOpportunityScore(customerId);

  // 2. Build context for the LLM
  const context = buildInsightsContext(customer, pis, os);

  // 3. Call Gemini for structured recommendations
  const prompt = buildInsightsPrompt(context);

  let aiOutput: any;
  try {
    const raw = await generateResponse(prompt);
    aiOutput = parseAiResponse(raw);
  } catch (error: any) {
    console.error(`⚠️ AI insights generation failed for ${customerId}:`, error.message);
    // Fall back to rule-based generation
    aiOutput = buildFallbackInsights(customer, pis, os);
  }

  // 4. Persist to DB
  const upsertQuery = `
    INSERT INTO customer_insights (
      customer_id, recommendations, why_opportunity, customer_tip, talking_points,
      lesson_recommendations, generated_at, triggered_by,
      pis_at_generation, os_at_generation
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)
    ON CONFLICT (customer_id) DO UPDATE SET
      recommendations = $2, why_opportunity = $3, customer_tip = $4, talking_points = $5,
      lesson_recommendations = $6, generated_at = NOW(), triggered_by = $7,
      pis_at_generation = $8, os_at_generation = $9
    RETURNING *
  `;

  await pool.query(upsertQuery, [
    customerId,
    JSON.stringify(aiOutput.recommendations),
    aiOutput.why_opportunity,
    aiOutput.customer_tip,
    JSON.stringify(aiOutput.talking_points),
    JSON.stringify(aiOutput.lesson_recommendations),
    triggeredBy,
    pis.protection_intelligence_score,
    os.opportunity_score,
  ]);

  console.log(`🤖 AI insights generated for customer ${customerId} (trigger: ${triggeredBy})`);

  return {
    recommendations: aiOutput.recommendations,
    why_opportunity: aiOutput.why_opportunity,
    customer_tip: aiOutput.customer_tip,
    talking_points: aiOutput.talking_points,
    lesson_recommendations: aiOutput.lesson_recommendations,
    pis_at_generation: pis.protection_intelligence_score,
    os_at_generation: os.opportunity_score,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Fetch cached insights. Returns null if not yet generated.
 */
export async function getCachedInsights(customerId: string): Promise<CustomerInsights | null> {
  const result = await pool.query(
    `SELECT * FROM customer_insights WHERE customer_id = $1`,
    [customerId]
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    recommendations: row.recommendations,
    why_opportunity: row.why_opportunity,
    customer_tip: row.customer_tip,
    talking_points: row.talking_points,
    lesson_recommendations: row.lesson_recommendations,
    pis_at_generation: parseFloat(row.pis_at_generation),
    os_at_generation: parseFloat(row.os_at_generation),
    generated_at: row.generated_at,
  };
}

/**
 * Get insights — serve cached, or generate if missing.
 * This is what the API endpoints call.
 */
export async function getInsights(customerId: string): Promise<CustomerInsights> {
  const cached = await getCachedInsights(customerId);
  if (cached) return cached;

  // No cached insights — generate now (first time or migration)
  return generateAndCacheInsights(customerId, 'FIRST_ACCESS');
}

// ─── Prompt Construction ──────────────────────────────────────

function buildInsightsContext(customer: any, pis: any, os: any): string {
  const age = customer.date_of_birth ? calcAge(customer.date_of_birth) : 'Unknown';

  return `
CUSTOMER PROFILE:
- Name: ${customer.first_name} ${customer.last_name}
- Age: ${age}
- Life Stage: ${customer.life_stage}
- Marital Status: ${customer.marital_status || 'Unknown'}
- Dependents: ${customer.dependents || 0}
- Children: ${customer.children || 0}
- Annual Income: ₹${formatNum(customer.annual_income)}
- Occupation: ${customer.occupation || 'Unknown'}
- Single Earner: ${customer.single_earner ? 'Yes' : 'No'}
- Home Loan: ${customer.home_loan ? 'Yes (₹' + formatNum(customer.existing_liabilities) + ')' : 'No'}
- Smoker: ${customer.smoker ? 'Yes' : 'No'}
- City: ${customer.city || 'Unknown'}
- Renewal Due: ${customer.renewal_due_days != null ? customer.renewal_due_days + ' days' : 'Unknown'}
- Last Interaction: ${customer.last_interaction_days || 'Unknown'} days ago

CURRENT COVERAGE:
- Health: ${customer.health_cover ? '✓ Covered' : '✗ NOT covered'}
- Term Life: ${customer.term_cover ? '✓ Covered' : '✗ NOT covered'}
- Life: ${customer.life_cover ? '✓ Covered' : '✗ NOT covered'}
- Motor: ${customer.motor_cover ? '✓ Covered' : '✗ NOT covered'}
- External Policies: ${customer.external_policies || 0}

PROTECTION SCORE (PIS): ${pis.protection_intelligence_score}/100
Score Breakdown:
${Object.entries(pis.score_breakdown).map(([k, v]: [string, any]) => `  - ${k}: ${v.score}/${v.max}`).join('\n')}

OPPORTUNITY SCORE (OS): ${os.opportunity_score}/100
Opportunity Breakdown:
${Object.entries(os.opportunity_breakdown).map(([k, v]: [string, any]) => `  - ${k}: ${v}`).join('\n')}

COVERAGE GAPS: ${pis.weak_spots.join(', ') || 'None'}
TOP GAP: ${pis.top_gap}
`.trim();
}

function buildInsightsPrompt(context: string): string {
  return `You are an insurance advisory AI for PBPartners, an Indian insurance distribution platform.

Given the customer data below, generate structured insights in JSON format.

${context}

Generate a JSON object with these exact keys:

{
  "recommendations": [
    {
      "priority": 1,
      "product": "health|term|life|motor|critical_illness",
      "title": "Short compelling headline (max 60 chars)",
      "message": "Personalized 2-3 sentence message for the customer explaining why they need this product. Reference their specific situation (income, dependents, gaps). Use ₹ for amounts.",
      "advisor_pitch": "One paragraph talking point for the advisor on how to pitch this to the customer. Include objection handling tips.",
      "impact": "Expected improvement to Protection Score (e.g., '+10 to +13 points')",
      "urgency": "high|medium|low"
    }
  ],
  "why_opportunity": "A 2-3 sentence paragraph explaining why this customer is an opportunity for the advisor RIGHT NOW. Reference specific data points like renewal timing, coverage gaps, family situation, and conversion signals.",
  "customer_tip": "A 2-sentence tip written FOR the customer in friendly, simple language. It should highlight their biggest risk or the single most impactful action they can take. No jargon, no advisor-speak. Example: 'Your family depends on your income, but you have no health cover. Adding a family floater now protects everyone and could save you 15% with a combo bundle.'",
  "talking_points": [
    "Natural conversation opener 1 referencing a specific data point",
    "Natural conversation opener 2",
    "Natural conversation opener 3"
  ],
  "lesson_recommendations": [
    {
      "priority": true/false,
      "icon": "emoji icon (🏥, 📄, 🚗, 🧬, 🛡️)",
      "title": "Short actionable title",
      "body": "One sentence explaining the key insight for the advisor"
    }
  ]
}

RULES:
- Only recommend products for actual gaps (don't recommend health if already covered)
- Maximum 4 recommendations, minimum 1
- Talking points should be natural conversation starters, not salesy
- Reference Indian context (₹, Indian insurance products, IRDAI)
- If customer is well-covered, recommend add-ons (critical illness, super top-up)
- urgency = "high" only if renewal is within 30 days AND the gap is critical
- lesson_recommendations: max 3 items, first one should have priority=true
- Be specific — use actual numbers from the data (income, dependents count, days to renewal)

Return ONLY the JSON object. No markdown, no explanation, no code blocks.`;
}

// ─── Response Parsing ─────────────────────────────────────────

function parseAiResponse(raw: string): {
  recommendations: AiRecommendation[];
  why_opportunity: string;
  customer_tip: string;
  talking_points: string[];
  lesson_recommendations: AiLessonItem[];
} {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  const parsed = JSON.parse(cleaned);

  // Validate structure
  if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
    throw new Error('Missing recommendations array');
  }
  if (!parsed.why_opportunity || typeof parsed.why_opportunity !== 'string') {
    throw new Error('Missing why_opportunity string');
  }
  if (!parsed.talking_points || !Array.isArray(parsed.talking_points)) {
    throw new Error('Missing talking_points array');
  }
  if (!parsed.lesson_recommendations || !Array.isArray(parsed.lesson_recommendations)) {
    throw new Error('Missing lesson_recommendations array');
  }

  return {
    recommendations: parsed.recommendations.slice(0, 4),
    why_opportunity: parsed.why_opportunity,
    customer_tip: parsed.customer_tip || '',
    talking_points: parsed.talking_points.slice(0, 5),
    lesson_recommendations: parsed.lesson_recommendations.slice(0, 3),
  };
}

// ─── Fallback (rule-based, if AI fails) ───────────────────────

function buildFallbackInsights(customer: any, pis: any, os: any) {
  const recommendations: AiRecommendation[] = [];
  let priority = 1;

  if (!customer.health_cover) {
    recommendations.push({
      priority: priority++,
      product: 'health',
      title: 'Get Health Insurance — Your Biggest Gap',
      message: customer.single_earner
        ? `As the sole earner with ${customer.dependents || 0} dependents, a health emergency could wipe out savings. A family health plan protects everyone.`
        : `Without health cover, a single hospitalization costs ₹3-5 lakhs out of pocket. Getting covered now locks in lower premiums at your age.`,
      advisor_pitch: `Missing health cover. ${customer.single_earner ? 'Single earner' : 'Dual income'}, ${customer.dependents || 0} dependents. ${customer.renewal_due_days && customer.renewal_due_days < 30 ? `Renewal in ${customer.renewal_due_days} days — perfect bundling window.` : 'Pitch family floater.'}`,
      impact: '+10 to +13 points on Protection Score',
      urgency: customer.renewal_due_days && customer.renewal_due_days < 30 ? 'high' : 'medium',
    });
  }

  if (!customer.term_cover) {
    recommendations.push({
      priority: priority++,
      product: 'term',
      title: (customer.children || 0) > 0 ? "Protect Your Children's Future" : 'Secure Your Family with Term Cover',
      message: (customer.children || 0) > 0
        ? `Your ${customer.children} children depend on your income. A term plan ensures their education and future even if something happens to you.`
        : `Term insurance gives you the highest coverage at the lowest cost. Locking in now means lower premiums for 20-30 years of protection.`,
      advisor_pitch: `No term cover. ${(customer.children || 0) > 0 ? `${customer.children} children — emotional sell around education fund.` : customer.home_loan ? 'Home loan outstanding — position as loan protection.' : 'Basic income protection pitch.'}`,
      impact: '+8 to +15 points on Protection Score',
      urgency: (customer.children || 0) > 0 ? 'high' : 'medium',
    });
  }

  if (!customer.life_cover) {
    recommendations.push({
      priority: priority++,
      product: 'life',
      title: 'Build Wealth with Life Insurance',
      message: 'A life plan gives dual benefits — protection plus savings. Valuable for retirement planning.',
      advisor_pitch: 'No life cover. Position as savings + protection combo for retirement.',
      impact: '+7 points on Protection Score',
      urgency: 'low',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 1,
      product: 'critical_illness',
      title: 'Add Critical Illness Cover',
      message: 'You are well protected! Consider a critical illness rider for lump-sum payouts on diagnosis of major illnesses.',
      advisor_pitch: 'Well-covered customer. Upsell CI rider — "the gap health insurance doesn\'t cover."',
      impact: '+2 points (external policy recognition)',
      urgency: 'low',
    });
  }

  // Build whyOpportunity
  const coveredProducts: string[] = [];
  if (customer.motor_cover) coveredProducts.push('Motor');
  if (customer.life_cover) coveredProducts.push('Life');
  if (customer.health_cover) coveredProducts.push('Health');
  if (customer.term_cover) coveredProducts.push('Term');
  const missingProducts: string[] = pis.weak_spots || [];

  let why_opportunity: string;
  if (missingProducts.length === 0) {
    why_opportunity = `${customer.first_name} has comprehensive coverage. Focus on add-ons, super top-ups, and retention strategies.`;
  } else {
    why_opportunity = `${customer.first_name} holds ${coveredProducts.join(' and ')} policies but is missing ${missingProducts.join(' and ')} coverage.`;
    if (customer.renewal_due_days != null && customer.renewal_due_days < 30) {
      why_opportunity += ` Renewal in ${customer.renewal_due_days} days creates a high-trust window to discuss additional protection.`;
    }
  }

  // Customer-facing tip
  let customer_tip: string;
  if (!customer.health_cover && customer.single_earner) {
    customer_tip = `Your family depends on your income, but you have no health cover. Adding a family floater now protects everyone and could save you up to 15% with a combo bundle.`;
  } else if (!customer.health_cover) {
    customer_tip = `You're missing health coverage — one hospital visit could cost ₹3-5 lakhs out of pocket. Getting covered now locks in lower premiums at your current age.`;
  } else if (!customer.term_cover && (customer.children || 0) > 0) {
    customer_tip = `Your children depend on your income. A term plan secures their education and future even if something unexpected happens.`;
  } else if (!customer.term_cover && customer.home_loan) {
    customer_tip = `You have a home loan but no term cover. If something happens, your family would need to keep up with EMIs on their own.`;
  } else {
    customer_tip = `Your protection profile looks solid. Keep your policies verified and explore add-ons to stay ahead of rising costs.`;
  }

  // Talking points
  const talking_points: string[] = [];
  if (customer.renewal_due_days != null && customer.renewal_due_days < 30) {
    talking_points.push(`Your policy renews in ${customer.renewal_due_days} days — great time to review your full protection.`);
  }
  if ((customer.dependents || 0) >= 1 && !customer.health_cover) {
    talking_points.push(`With ${customer.dependents} dependents and no health cover, a single hospital visit could strain your savings.`);
  }
  if (customer.home_loan && !customer.term_cover) {
    talking_points.push(`Your home loan means your family needs income protection to keep up with EMIs.`);
  }
  if (talking_points.length === 0) {
    talking_points.push(`Let's review your coverage to make sure everything stays current and optimized.`);
  }

  // Lesson recommendations
  const lesson_recommendations: AiLessonItem[] = recommendations.slice(0, 3).map((r, i) => ({
    priority: i === 0,
    icon: r.product === 'health' ? '🏥' : r.product === 'term' ? '📄' : r.product === 'motor' ? '🚗' : '🧬',
    title: r.title,
    body: r.message.split('.')[0] + '.',
  }));

  return { recommendations, why_opportunity, customer_tip, talking_points, lesson_recommendations };
}

// ─── Helpers ──────────────────────────────────────────────────

function calcAge(dob: string): number {
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
