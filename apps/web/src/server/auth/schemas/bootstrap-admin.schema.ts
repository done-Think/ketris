import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserSchema } from './user.schema'

export const bootstrapAdminRequestSchema = z
  .object({
    tenantSlug: z.string().min(1, 'Informe o tenant.').openapi({ example: 'ketris-demo' }),
    nome: z.string().min(1, 'Nome é obrigatório.').openapi({ example: 'Primeiro Admin' }),
    email: z.string().email('E-mail inválido.').openapi({ example: 'admin@ketris.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .openapi('BootstrapAdminRequest')

export type BootstrapAdminRequestDTO = z.infer<typeof bootstrapAdminRequestSchema>

export const bootstrapAdminResponseSchema = z
  .object({
    user: authenticatedUserSchema,
  })
  .openapi('BootstrapAdminResponse')
