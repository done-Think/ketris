import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const createPlatformAdminRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).openapi({ example: 'Sócio Ketris' }),
    email: z.string().trim().max(254).email().openapi({ example: 'socio@ketris.dev' }),
    password: z.string().min(8).max(128).openapi({ example: 'trocar-em-desenvolvimento' }),
    role: z.enum(['ADMIN', 'ADMIN_AGENT', 'AGENT']).openapi({ example: 'ADMIN' }),
  })
  .strict()
  .openapi('CreatePlatformAdminRequest')

export const createPlatformAdminResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
  })
  .openapi('CreatePlatformAdminResponse')
