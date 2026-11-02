import { z } from 'zod'

export const livenessSequenceSchema = z.object({
  challenges: z
    .array(z.enum(['turnLeft', 'turnRight', 'closer']))
    .length(3)
    .refine((steps) => new Set(steps).size === steps.length),
  step: z.number().int().min(0).max(3),
})

export const deferredLivenessPlanSchema = livenessSequenceSchema.extend({
  planId: z.string().uuid(),
  expiresAt: z.string().datetime(),
})
