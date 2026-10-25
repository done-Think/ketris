import { z } from 'zod'

import { papelSchema } from './user.schema'

export const accessTokenClaimsSchema = z.object({
  sub: z.string().trim().min(1),
  tenantId: z.string().trim().min(1),
  papel: papelSchema,
  sessionVersion: z.number().int().nonnegative().default(0),
  exp: z.number().int().positive(),
})
