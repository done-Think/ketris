import '@server/openapi/zod-extend'
import { authenticatedUserSchema } from '@server/auth/schemas/user.schema'
import { z } from 'zod'

export const createTenantAdminRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Nome é obrigatório.')
      .max(120, 'Nome muito longo.')
      .openapi({ example: 'Admin da Imobiliária' }),
    email: z
      .string()
      .trim()
      .max(254, 'E-mail inválido.')
      .email('E-mail inválido.')
      .openapi({ example: 'admin@imobiliaria.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .max(128, 'Senha muito longa.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .strict()
  .openapi('CreateTenantAdminRequest')

export const createTenantAdminResponseSchema = z
  .object({
    user: authenticatedUserSchema,
  })
  .openapi('CreateTenantAdminResponse')
