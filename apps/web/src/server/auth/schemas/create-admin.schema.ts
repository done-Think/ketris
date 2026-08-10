import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserSchema } from './user.schema'

export const createAdminRequestSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório.').openapi({ example: 'Novo Admin' }),
    email: z.string().email('E-mail inválido.').openapi({ example: 'admin2@ketris.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .openapi('CreateAdminRequest')

export type CreateAdminRequestDTO = z.infer<typeof createAdminRequestSchema>

export const createAdminResponseSchema = z
  .object({
    user: authenticatedUserSchema,
  })
  .openapi('CreateAdminResponse')
