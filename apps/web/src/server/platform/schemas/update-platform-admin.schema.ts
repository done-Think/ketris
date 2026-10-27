import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const updatePlatformAdminRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório.').max(120, 'Nome muito longo.').optional(),
    email: z.string().trim().max(254, 'E-mail inválido.').email('E-mail inválido.').optional(),
    role: z.enum(['ADMIN', 'ADMIN_AGENT', 'AGENT']).optional(),
    active: z.literal(true).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.role !== undefined ||
      data.active !== undefined,
    {
      message: 'Informe ao menos um campo para atualizar.',
    },
  )
  .openapi('UpdatePlatformAdminRequest')

export const updatePlatformAdminResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
  })
  .openapi('UpdatePlatformAdminResponse')
