import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { HttpError } from '../../shared/errors/http-error';
import { getRecommendedTemplate } from './llm.service';

const baseSchema = z.object({
  key: z.union([z.literal(1), z.literal(3)]).optional(),
  partner_code: z.string().trim().min(1).max(50),
  partner_name: z.string().trim().min(1).max(120),
  partner_group: z.string().trim().min(1).max(50).optional(),
  partner_dob: z.string().trim().min(1).max(20).optional(),
  partner_phone_number: z.string().trim().min(1).max(20).optional(),
  email: z.string().trim().email().optional(),
  city: z.string().trim().min(1).max(80).optional(),
  experience_years: z.number().int().min(0).max(60).optional(),
  top_product: z.string().trim().min(1).max(120).optional(),
  monthly_booking: z.number().int().min(0).optional(),
  monthly_renewals: z.number().int().min(0).optional(),
  include_poster: z.boolean().optional(),
  protectionScore: z.number().int().min(0).max(100).optional(),
  insight_text: z.string().trim().min(1).max(300).optional(),
  current_date: z.string().trim().min(1).max(40).optional(),
  user_prompt: z.string().trim().min(1).max(1000).optional(),
});

const requestSchema = baseSchema.superRefine((data, ctx) => {
  const key = data.key ?? 1;

  if (key === 1) {
    if (!data.partner_group) {
      ctx.addIssue({
        code: 'custom',
        message: 'partner_group is required when key=1',
        path: ['partner_group'],
      });
    }
    if (!data.partner_dob) {
      ctx.addIssue({
        code: 'custom',
        message: 'partner_dob is required when key=1',
        path: ['partner_dob'],
      });
    }
    return;
  }

  if (data.protectionScore === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'protectionScore is required when key=3',
      path: ['protectionScore'],
    });
  }
  if (!data.insight_text) {
    ctx.addIssue({
      code: 'custom',
      message: 'insight_text is required when key=3',
      path: ['insight_text'],
    });
  }
});

export async function getRecommandTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join('; ');
      throw new HttpError(400, message || 'Invalid request payload');
    }

    const result = await getRecommendedTemplate({
      key: parsed.data.key ?? 1,
      ...parsed.data,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
