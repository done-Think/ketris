import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const bootstrapPlatformAdminRequestSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório.').openapi({ example: 'Alysson Sene' }),
    email: z.string().email('E-mail inválido.').openapi({ example: 'alysson@ketris.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .openapi('BootstrapPlatformAdminRequest')

export type BootstrapPlatformAdminRequestDTO = z.infer<typeof bootstrapPlatformAdminRequestSchema>

export const bootstrapPlatformAdminResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
  })
  .openapi('BootstrapPlatformAdminResponse')
