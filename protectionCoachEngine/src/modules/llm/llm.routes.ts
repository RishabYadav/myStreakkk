import { Router } from 'express';
import { getRecommandTemplate } from './llm.controller';

const router = Router();

router.post('/get-recommand-template', getRecommandTemplate);

export default router;
