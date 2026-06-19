import { Router } from 'express';
import { getIntelligence } from './partner-intelligence.controller';
import { getCustomerContact } from './partner-contact.controller';

const router = Router();

router.get('/:partnerId/intelligence', getIntelligence);
router.get('/:partnerId/customer/:customerId/contact', getCustomerContact);

export default router;
