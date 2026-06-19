import { z } from 'zod';

export const cadenceOutputSchema = z.object({
  coach_tip: z.string().trim().min(1).max(800),
  whatsapp_message: z.string().trim().min(1).max(1200),
  mission: z.object({
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().trim().min(1).max(240),
    action: z.string().trim().min(1).max(240),
    tags: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
  }),
  talking_points: z.array(z.string().trim().min(1).max(400)).length(3),
  lesson_recommendations: z
    .array(
      z.object({
        priority: z.boolean(),
        icon: z.enum(['hospital', 'document', 'car', 'shield', 'family', 'money']),
        title: z.string().trim().min(1).max(140),
        body: z.string().trim().min(1).max(400),
      })
    )
    .length(3),
});

export type CadenceOutput = z.infer<typeof cadenceOutputSchema>;
