import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const updatePlatformAdminRequestSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório.').optional(),
    email: z.string().email('E-mail inválido.').optional(),
  })
  .refine((data) => data.nome !== undefined || data.email !== undefined, {
    message: 'Informe ao menos um campo para atualizar.',
  })
  .openapi('UpdatePlatformAdminRequest')

export type UpdatePlatformAdminRequestDTO = z.infer<typeof updatePlatformAdminRequestSchema>

export const updatePlatformAdminResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
  })
  .openapi('UpdatePlatformAdminResponse')
