import { Router } from 'express';
import { getIntelligence } from './partner-intelligence.controller';

const router = Router();

router.get('/:partnerId/intelligence', getIntelligence);

export default router;
