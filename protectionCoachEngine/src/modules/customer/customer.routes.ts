import { Router } from 'express';
import * as controller from './customer.controller';

const router = Router();

router.post('/', controller.createCustomer);
router.get('/', controller.getAllCustomers);
router.get('/:id', controller.getCustomerById);
router.put('/:id', controller.updateCustomer);
router.delete('/:id', controller.deleteCustomer);

export default router;
