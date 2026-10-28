import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserResponseSchema, tenantMemberRoleSchema } from './user.schema'

export const updateUserRequestSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório.').max(200).optional(),
    email: z.string().trim().max(254).email('E-mail inválido.').optional(),
    phone: z
      .string()
      .trim()
      .max(32)
      .refine((value) => {
        const digits = value.replace(/\D/g, '')
        return digits.length === 10 || digits.length === 11
      }, 'Telefone inválido.')
      .nullable()
      .optional(),
    creci: z.string().trim().max(32).nullable().optional(),
    avatarUrl: z.string().min(1).nullable().optional(),
    role: tenantMemberRoleSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.phone !== undefined ||
      data.creci !== undefined ||
      data.name !== undefined ||
      data.email !== undefined ||
      data.avatarUrl !== undefined ||
      data.role !== undefined,
    {
      message: 'Informe ao menos um campo para atualizar.',
    },
  )
  .openapi('UpdateUserRequest')

export const updateUserResponseSchema = z
  .object({
    user: authenticatedUserResponseSchema,
  })
  .openapi('UpdateUserResponse')
