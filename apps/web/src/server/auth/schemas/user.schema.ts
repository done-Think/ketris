import '@server/openapi/zod-extend'
import { z } from 'zod'

export const papelSchema = z.enum(['ADMIN', 'OWNER', 'AGENT', 'RENTER'])

export const nonAdminPapelSchema = z.enum(['OWNER', 'AGENT'])

export const authenticatedUserSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    nome: z.string(),
    email: z.string().email(),
    avatarUrl: z.string().min(1).nullable(),
    papel: papelSchema,
    ativo: z.boolean(),
  })
  .openapi('AuthenticatedUser')

export const authenticatedUserResponseSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatarUrl: z.string().min(1).nullable(),
    role: papelSchema,
    active: z.boolean(),
    pendingApproval: z.boolean(),
  })
  .openapi('AuthenticatedUserResponse')
