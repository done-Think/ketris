import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserSchema, nonAdminPapelSchema } from './user.schema'

export const updateUserRequestSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório.').optional(),
    email: z.string().email('E-mail inválido.').optional(),
    papel: nonAdminPapelSchema.optional(),
  })
  .refine(
    (data) => data.nome !== undefined || data.email !== undefined || data.papel !== undefined,
    {
      message: 'Informe ao menos um campo para atualizar.',
    },
  )
  .openapi('UpdateUserRequest')

export type UpdateUserRequestDTO = z.infer<typeof updateUserRequestSchema>

export const updateUserResponseSchema = z
  .object({
    user: authenticatedUserSchema,
  })
  .openapi('UpdateUserResponse')
