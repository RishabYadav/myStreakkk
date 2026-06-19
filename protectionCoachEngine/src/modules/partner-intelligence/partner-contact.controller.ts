import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../../shared/errors/http-error';
import { findPartnerCustomerContact } from './partner-contact.repository';

const contactParamsSchema = z.object({
  partnerId: z.string().trim().min(1).max(50),
  customerId: z.string().trim().min(1).max(255),
});

export async function getCustomerContact(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = contactParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new HttpError(400, 'A valid partnerId and customerId are required');
    }
    const contact = await findPartnerCustomerContact(
      parsed.data.partnerId,
      parsed.data.customerId
    );
    if (!contact) {
      throw new HttpError(
        404,
        `Customer ${parsed.data.customerId} was not found for partner ${parsed.data.partnerId}`
      );
    }
    if (!contact.phone) {
      throw new HttpError(409, `No phone number is available for customer ${contact.customer_id}`);
    }
    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
}
