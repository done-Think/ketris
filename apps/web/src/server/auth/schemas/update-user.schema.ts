import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserResponseSchema, nonAdminPapelSchema } from './user.schema'

export const updateUserRequestSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório.').optional(),
    email: z.string().email('E-mail inválido.').optional(),
    role: nonAdminPapelSchema.optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.email !== undefined || data.role !== undefined,
    {
      message: 'Informe ao menos um campo para atualizar.',
    },
  )
  .openapi('UpdateUserRequest')

export type UpdateUserRequestDTO = z.infer<typeof updateUserRequestSchema>

export const updateUserResponseSchema = z
  .object({
    user: authenticatedUserResponseSchema,
  })
  .openapi('UpdateUserResponse')
