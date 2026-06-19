import { Router } from 'express';
import * as controller from './scoring.controller';

const router = Router();

// PIS - Protection Intelligence Score (Customer-facing)
router.get('/customer/:customerId/protection', controller.getProtectionScore);

// OS - Opportunity Score (Agent-facing)
router.get('/customer/:customerId/opportunity', controller.getOpportunityScore);

// Personalized recommendations
router.get('/customer/:customerId/recommendations', controller.getRecommendations);

// Risk Simulations
router.post('/customer/:customerId/simulate', controller.runSimulation);
router.get('/customer/:customerId/simulations', controller.getSimulationHistory);

// Combined scores
router.get('/customer/:customerId/both', controller.getBothScores);

// Full profile (everything CustomerFile UI needs in one call)
router.get('/customer/:customerId/full-profile', controller.getCustomerFullProfile);

// Score history
router.get('/customer/:customerId/history', controller.getScoreHistory);

// Coverage event — triggers PIS recalculation
router.post('/coverage-event', controller.handleCoverageEvent);

// Partner ranked customers (by OS descending)
router.get('/partner/:partnerId/customers-ranked', controller.getCustomersRanked);

// Manual recalculate
router.post('/customer/:customerId/recalculate', controller.recalculateScores);

// Regenerate AI insights for a customer (manual trigger)
router.post('/customer/:customerId/regenerate-insights', controller.regenerateInsights);

export default router;
