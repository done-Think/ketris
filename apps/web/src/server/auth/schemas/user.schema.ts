import '@server/openapi/zod-extend'
import { z } from 'zod'

export const userRoleSchema = z.enum(['OWNER', 'AGENT', 'RENTER', 'PROPERTY_OWNER'])

export const tenantMemberRoleSchema = z.enum(['OWNER', 'AGENT', 'PROPERTY_OWNER'])

export const authenticatedUserSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatarUrl: z.string().min(1).nullable(),
    role: userRoleSchema,
    active: z.boolean(),
  })
  .openapi('AuthenticatedUser')

export const authenticatedUserResponseSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    phone: z.string().nullable(),
    creci: z.string().nullable(),
    email: z.string().email(),
    avatarUrl: z.string().min(1).nullable(),
    role: userRoleSchema,
    active: z.boolean(),
    pendingApproval: z.boolean(),
  })
  .openapi('AuthenticatedUserResponse')
