import '@server/openapi/zod-extend'
import { authenticatedUserResponseSchema } from '@server/auth/schemas/user.schema'
import { z } from 'zod'

export const createTenantAdminRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).openapi({ example: 'Admin da Imobiliária' }),
    email: z.string().trim().max(254).email().openapi({ example: 'admin@imobiliaria.dev' }),
    password: z.string().min(8).max(128).openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .strict()
  .openapi('CreateTenantAdminRequest')

export const createTenantAdminResponseSchema = z
  .object({
    user: authenticatedUserResponseSchema,
  })
  .openapi('CreateTenantAdminResponse')
