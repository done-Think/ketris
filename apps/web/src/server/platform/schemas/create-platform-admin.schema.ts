import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const createPlatformAdminRequestSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório.').openapi({ example: 'Sócio Ketris' }),
    email: z.string().email('E-mail inválido.').openapi({ example: 'socio@ketris.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .openapi('CreatePlatformAdminRequest')

export type CreatePlatformAdminRequestDTO = z.infer<typeof createPlatformAdminRequestSchema>

export const createPlatformAdminResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
  })
  .openapi('CreatePlatformAdminResponse')
