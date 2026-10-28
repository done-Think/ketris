import { z } from 'zod'

import { userRoleSchema } from './user.schema'

const currentAccessTokenClaimsSchema = z.object({
  sub: z.string().trim().min(1),
  tenantId: z.string().trim().min(1),
  role: userRoleSchema,
  sessionVersion: z.number().int().nonnegative().default(0),
  exp: z.number().int().positive(),
})

export const accessTokenClaimsSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const claims = value as Record<string, unknown>
  if (claims.role !== undefined && claims.papel !== undefined && claims.role !== claims.papel)
    return null
  return { ...claims, role: claims.role === undefined ? claims.papel : claims.role }
}, currentAccessTokenClaimsSchema)
