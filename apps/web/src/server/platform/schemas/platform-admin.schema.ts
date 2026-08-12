import '@server/openapi/zod-extend'
import { z } from 'zod'

export const authenticatedPlatformAdminSchema = z
  .object({
    id: z.string(),
    nome: z.string(),
    email: z.string().email(),
    ativo: z.boolean(),
  })
  .openapi('AuthenticatedPlatformAdmin')
