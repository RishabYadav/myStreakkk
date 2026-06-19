import { eventBus, markEventProcessed, markEventFailed } from '../event-bus';
import { calculateProtectionScore } from '../../scoring/engines/protection-score.engine';
import { calculateOpportunityScore } from '../../scoring/engines/opportunity-score.engine';

// Events that trigger score recalculation
const RECALC_TRIGGERS = [
  'POLICY_CREATED',
  'POLICY_UPDATED',
  'POLICY_EXPIRED',
  'POLICY_CANCELLED',
  'POLICY_RENEWED',
  'CUSTOMER_PROFILE_UPDATED',
  'CUSTOMER_ENGAGEMENT_LOGGED',
];

export function registerScoreRecalcHandler() {
  eventBus.on('domainEvent', async (event: any) => {
    if (!RECALC_TRIGGERS.includes(event.event_type)) return;

    console.log(`📊 Recalculating scores for customer ${event.customer_id} (trigger: ${event.event_type})`);

    try {
      await calculateProtectionScore(event.customer_id);
      await calculateOpportunityScore(event.customer_id);
      await markEventProcessed(event.id);
      console.log(`✅ Scores recalculated for customer ${event.customer_id}`);
    } catch (error: any) {
      console.error(`❌ Score recalculation failed for customer ${event.customer_id}:`, error.message);
      await markEventFailed(event.id, error.message);
    }
  });

  console.log('🎯 Score recalculation handler registered');
}
