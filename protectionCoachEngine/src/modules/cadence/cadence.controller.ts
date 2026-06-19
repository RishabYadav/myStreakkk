import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../../shared/errors/http-error';
import { generateCadence } from './cadence.service';
import { presentCadenceResult } from './cadence.presenter';

const generateCadenceSchema = z
  .object({
    partner_id: z.string().trim().min(1).max(50),
    customer_id: z.string().trim().min(1).max(255).optional(),
    force_refresh: z.boolean().optional(),
  })
  .strict();

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = generateCadenceSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        'Invalid request. partner_id is required; customer_id and force_refresh are optional'
      );
    }
    const result = await generateCadence(parsed.data);
    res.json({ success: true, data: presentCadenceResult(result) });
  } catch (error) {
    next(error);
  }
}
