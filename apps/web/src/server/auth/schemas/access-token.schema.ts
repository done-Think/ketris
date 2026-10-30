import { z } from 'zod'

import { userRoleSchema } from './user.schema'

export const accessTokenClaimsSchema = z
  .object({
    sub: z.string().trim().min(1),
    tenantId: z.string().trim().min(1),
    role: userRoleSchema,
    sessionVersion: z.number().int().nonnegative().default(0),
    iat: z.number().int().nonnegative().optional(),
    exp: z.number().int().positive(),
  })
  .strict()
