import { Request, Response, NextFunction } from 'express';
import * as policyService from './policy.service';

export async function createPolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const policy = await policyService.create(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
}

export async function getPoliciesByCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const policies = await policyService.findByCustomerId(customerId);
    res.json({ success: true, data: policies });
  } catch (error) {
    next(error);
  }
}

export async function getPolicyById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const policy = await policyService.findById(id);
    if (!policy) {
      res.status(404).json({ success: false, error: 'Policy not found' });
      return;
    }
    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
}

export async function updatePolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const policy = await policyService.update(id, req.body);
    if (!policy) {
      res.status(404).json({ success: false, error: 'Policy not found' });
      return;
    }
    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
}

export async function deletePolicy(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const policy = await policyService.remove(id);
    if (!policy) {
      res.status(404).json({ success: false, error: 'Policy not found' });
      return;
    }
    res.json({ success: true, data: { message: 'Policy deleted' } });
  } catch (error) {
    next(error);
  }
}
