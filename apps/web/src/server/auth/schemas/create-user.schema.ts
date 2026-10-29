import '@server/openapi/zod-extend'
import { z } from 'zod'

import { resetPasswordRequestSchema } from './reset-password.schema'
import { authenticatedUserResponseSchema, tenantMemberRoleSchema } from './user.schema'

export const createUserRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Nome é obrigatório.')
      .max(200)
      .openapi({ example: 'Ana Agente' }),
    email: z
      .string()
      .trim()
      .max(254)
      .email('E-mail inválido.')
      .openapi({ example: 'ana@ketris.dev' }),
    password: resetPasswordRequestSchema.shape.password.openapi({
      example: 'trocar-em-desenvolvimento',
    }),
    role: tenantMemberRoleSchema.default('AGENT'),
  })
  .strict()
  .openapi('CreateUserRequest')

export const createUserResponseSchema = z
  .object({
    user: authenticatedUserResponseSchema,
  })
  .openapi('CreateUserResponse')
