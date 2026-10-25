import { z } from 'zod'

export const passwordResetTokenClaimsSchema = z.object({
  purpose: z.literal('password-reset'),
  sub: z.string().min(1),
  exp: z.number().int().positive(),
  sessionVersion: z.number().int().nonnegative().default(0),
})
