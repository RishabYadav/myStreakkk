import { Request, Response, NextFunction } from 'express';
import * as customerService from './customer.service';

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function getAllCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await customerService.findAll(page, limit);
    res.json({ success: true, data: result.customers, meta: { page: result.page, limit: result.limit, total: result.total } });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const customer = await customerService.findWithPolicies(id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const customer = await customerService.update(id, req.body);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const customer = await customerService.remove(id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }
    res.json({ success: true, data: { message: 'Customer deleted' } });
  } catch (error) {
    next(error);
  }
}
