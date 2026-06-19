import { Router } from 'express';
import * as controller from './policy.controller';

const router = Router();

router.post('/', controller.createPolicy);
router.get('/customer/:customerId', controller.getPoliciesByCustomer);
router.get('/:id', controller.getPolicyById);
router.put('/:id', controller.updatePolicy);
router.delete('/:id', controller.deletePolicy);

export default router;
