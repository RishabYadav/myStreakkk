import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';

// Route imports
import customerRoutes from './modules/customer/customer.routes';
import policyRoutes from './modules/policy/policy.routes';
import scoringRoutes from './modules/scoring/scoring.routes';
import aiRoutes from './modules/ai/ai.routes';
import partnerIntelligenceRoutes from './modules/partner-intelligence/partner-intelligence.routes';
import cadenceRoutes from './modules/cadence/cadence.routes';
import llmRoutes from './modules/llm/llm.routes';

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (v1)
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/policies', policyRoutes);
app.use('/api/v1', scoringRoutes);  // Scoring uses /api/v1/customer/:id/protection etc
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/partner', partnerIntelligenceRoutes);
app.use('/api/v1/cadence', cadenceRoutes);
app.use('/api/v1/llm', llmRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
