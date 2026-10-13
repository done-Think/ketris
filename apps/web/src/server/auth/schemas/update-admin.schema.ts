import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserResponseSchema } from './user.schema'

export const updateAdminRequestSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório.').optional(),
    email: z.string().email('E-mail inválido.').optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('UpdateAdminRequest')

export type UpdateAdminRequestDTO = z.infer<typeof updateAdminRequestSchema>

export const updateAdminResponseSchema = z
  .object({
    admin: authenticatedUserResponseSchema,
  })
  .openapi('UpdateAdminResponse')
