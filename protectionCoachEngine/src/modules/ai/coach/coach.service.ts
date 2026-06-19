import { generateResponse } from '../gemini.client';
import { buildCoachSystemPrompt, buildAdvisorContext } from '../prompts/coach.prompt';
import pool from '../../../config/database';
import { calculateProtectionScore } from '../../scoring/engines/protection-score.engine';
import { calculateOpportunityScore } from '../../scoring/engines/opportunity-score.engine';
import { getRecommendations } from '../../scoring/recommendations.engine';

/**
 * AI Coach Service — Advisor Facing
 * 
 * The coach receives pre-computed scores and generates:
 * 1. Customer summary
 * 2. Why this customer is a priority
 * 3. What to pitch
 * 4. Conversation starters
 * 5. Objection handlers
 */

export async function getCoachInsights(customerId: string): Promise<string> {
  const context = await buildFullContext(customerId);
  const systemPrompt = buildCoachSystemPrompt(context);

  const prompt = `${systemPrompt}

Generate a structured advisor briefing with these sections:

## Customer Summary
One paragraph about who this customer is and their situation.

## Why This Customer Now
Why should the advisor prioritize this customer today? Reference the Opportunity Score dimensions.

## Top 3 Actions
Numbered list of specific actions to take, with products to pitch.

## Conversation Starters
3 natural opening lines the advisor can use.

## Objection Handlers
Common objections this customer might raise and how to address them.

## Timing
Best time/channel to reach out based on engagement data.`;

  return generateResponse(prompt);
}

export async function askCoach(customerId: string, advisorQuestion: string): Promise<string> {
  const context = await buildFullContext(customerId);
  const systemPrompt = buildCoachSystemPrompt(context);

  const prompt = `${systemPrompt}

Advisor's question: ${advisorQuestion}

Provide a concise, actionable answer based on the customer data and scores above.`;

  return generateResponse(prompt);
}

export async function getCustomerSummary(customerId: string): Promise<object> {
  const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])).rows[0];
  if (!customer) throw new Error('Customer not found');

  const pis = await calculateProtectionScore(customerId);
  const os = await calculateOpportunityScore(customerId);
  const recommendations = await getRecommendations(customerId);

  // Generate AI summary
  const context = buildAdvisorContext(customer, pis, os, recommendations);
  const systemPrompt = buildCoachSystemPrompt(context);

  const summaryPrompt = `${systemPrompt}

Generate a brief 2-sentence customer summary and a list of 3 key talking points. Return as plain text.`;

  const aiSummary = await generateResponse(summaryPrompt);

  return {
    customer_id: customerId,
    name: `${customer.first_name} ${customer.last_name}`,
    protection_score: pis.protection_intelligence_score,
    opportunity_score: os.opportunity_score,
    protection_breakdown: pis.score_breakdown,
    opportunity_breakdown: os.opportunity_breakdown,
    coverage: pis.coverage,
    gaps: pis.weak_spots,
    recommendations,
    ai_summary: aiSummary,
  };
}

async function buildFullContext(customerId: string): Promise<string> {
  const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])).rows[0];
  if (!customer) throw new Error('Customer not found');

  const pis = await calculateProtectionScore(customerId);
  const os = await calculateOpportunityScore(customerId);
  const recommendations = await getRecommendations(customerId);

  return buildAdvisorContext(customer, pis, os, recommendations);
}
