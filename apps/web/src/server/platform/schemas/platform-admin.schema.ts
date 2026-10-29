import '@server/openapi/zod-extend'
import { z } from 'zod'

export const authenticatedPlatformAdminSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'ADMIN_AGENT', 'AGENT']),
    active: z.boolean(),
    createdAt: z.string().openapi({ description: 'ISO 8601' }),
    lastAccessAt: z
      .string()
      .nullable()
      .openapi({ description: 'ISO 8601 do último login; null se nunca entrou.' }),
  })
  .openapi('AuthenticatedPlatformAdmin')
