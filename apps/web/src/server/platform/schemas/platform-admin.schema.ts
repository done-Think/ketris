import '@server/openapi/zod-extend'
import { z } from 'zod'

export const authenticatedPlatformAdminSchema = z
  .object({
    id: z.string(),
    nome: z.string(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'ADMIN_AGENT', 'AGENT']),
    ativo: z.boolean(),
  })
  .openapi('AuthenticatedPlatformAdmin')
