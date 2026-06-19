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

// Score history
router.get('/customer/:customerId/history', controller.getScoreHistory);

// Coverage event — triggers PIS recalculation
router.post('/coverage-event', controller.handleCoverageEvent);

// Partner ranked customers (by OS descending)
router.get('/partner/:partnerId/customers-ranked', controller.getCustomersRanked);

// Manual recalculate
router.post('/customer/:customerId/recalculate', controller.recalculateScores);

export default router;
