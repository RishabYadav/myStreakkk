import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../../shared/errors/http-error';
import { getPartnerIntelligence } from './partner-intelligence.service';
import { presentPartnerIntelligence } from './partner-intelligence.presenter';

const partnerParamsSchema = z.object({
  partnerId: z.string().trim().min(1).max(50),
});

export async function getIntelligence(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = partnerParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new HttpError(400, 'A valid partnerId is required');
    }
    const intelligence = await getPartnerIntelligence(parsed.data.partnerId);
    res.json({ success: true, data: presentPartnerIntelligence(intelligence) });
  } catch (error) {
    next(error);
  }
}
