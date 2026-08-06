import '@server/openapi/zod-extend'
import { z } from 'zod'

export const papelSchema = z.enum(['ADMIN', 'OWNER', 'AGENT'])

export const nonAdminPapelSchema = z.enum(['OWNER', 'AGENT'])

export const authenticatedUserSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    nome: z.string(),
    email: z.string().email(),
    papel: papelSchema,
    ativo: z.boolean(),
  })
  .openapi('AuthenticatedUser')
