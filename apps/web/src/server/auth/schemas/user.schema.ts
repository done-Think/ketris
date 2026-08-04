import '@server/openapi/zod-extend'
import { z } from 'zod'

export const papelSchema = z.enum(['ADMIN', 'PROPRIETARIO', 'CORRETOR'])

export const authenticatedUserSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    nome: z.string(),
    email: z.string().email(),
    papel: papelSchema,
  })
  .openapi('AuthenticatedUser')
