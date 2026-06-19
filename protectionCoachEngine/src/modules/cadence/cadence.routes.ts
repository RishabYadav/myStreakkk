import { Router } from 'express';
import { generate } from './cadence.controller';

const router = Router();

router.post('/generate', generate);

export default router;
