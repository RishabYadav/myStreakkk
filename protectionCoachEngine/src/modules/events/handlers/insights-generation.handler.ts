import { eventBus } from '../event-bus';
import { generateAndCacheInsights } from '../../scoring/insights-generator';

/**
 * Insights Generation Handler
 *
 * Listens for the same domain events that trigger score recalculation.
 * Runs AFTER scores are recalculated (uses a slight delay to ensure scores are fresh).
 *
 * This is intentionally fire-and-forget — if AI generation fails, the API
 * falls back to cached stale insights or rule-based fallback. The user
 * experience is never blocked by this.
 */

const INSIGHTS_TRIGGERS = [
  'POLICY_CREATED',
  'POLICY_UPDATED',
  'POLICY_EXPIRED',
  'POLICY_CANCELLED',
  'POLICY_RENEWED',
  'CUSTOMER_PROFILE_UPDATED',
  'CUSTOMER_ENGAGEMENT_LOGGED',
];

export function registerInsightsGenerationHandler() {
  eventBus.on('domainEvent', async (event: any) => {
    if (!INSIGHTS_TRIGGERS.includes(event.event_type)) return;

    // Small delay to ensure score recalculation completes first
    setTimeout(async () => {
      try {
        await generateAndCacheInsights(event.customer_id, event.event_type);
      } catch (error: any) {
        // Non-fatal — insights are a nice-to-have, not critical path
        console.warn(`⚠️ Insights generation failed for ${event.customer_id}: ${error.message}`);
      }
    }, 2000);
  });

  console.log('🤖 AI Insights generation handler registered');
}
