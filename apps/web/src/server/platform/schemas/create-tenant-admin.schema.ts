import '@server/openapi/zod-extend'
import { authenticatedUserSchema } from '@server/auth/schemas/user.schema'
import { z } from 'zod'

export const createTenantAdminRequestSchema = z
  .object({
    nome: z.string().min(1, 'Nome é obrigatório.').openapi({ example: 'Admin da Imobiliária' }),
    email: z.string().email('E-mail inválido.').openapi({ example: 'admin@imobiliaria.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .openapi('CreateTenantAdminRequest')

export type CreateTenantAdminRequestDTO = z.infer<typeof createTenantAdminRequestSchema>

export const createTenantAdminResponseSchema = z
  .object({
    user: authenticatedUserSchema,
  })
  .openapi('CreateTenantAdminResponse')
