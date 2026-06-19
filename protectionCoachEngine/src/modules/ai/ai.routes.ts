import { Router } from 'express';
import * as controller from './ai.controller';

const router = Router();

// ─── Customer-facing AI Chat ──────────────────────────────────
router.post('/chat/start/:customerId', controller.startChat);
router.post('/chat/message', controller.sendChatMessage);
router.get('/chat/history/:sessionId', controller.getChatHistory);
router.get('/chat/sessions/:customerId', controller.getCustomerSessions);

// ─── Advisor-facing AI Coach ──────────────────────────────────
router.get('/coach/insights/:customerId', controller.getCoachInsights);
router.post('/coach/ask/:customerId', controller.askCoach);
router.get('/coach/summary/:customerId', controller.getCustomerSummary);

export default router;
