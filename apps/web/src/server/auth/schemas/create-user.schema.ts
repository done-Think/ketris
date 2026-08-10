import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserSchema, nonAdminPapelSchema } from './user.schema'

export const createUserRequestSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório.').openapi({ example: 'Ana Agente' }),
    email: z.string().email('E-mail inválido.').openapi({ example: 'ana@ketris.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
    papel: nonAdminPapelSchema.default('AGENT'),
  })
  .openapi('CreateUserRequest')

export type CreateUserRequestDTO = z.infer<typeof createUserRequestSchema>

export const createUserResponseSchema = z
  .object({
    user: authenticatedUserSchema,
  })
  .openapi('CreateUserResponse')
