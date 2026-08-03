import '@server/openapi/zod-extend'
import { z } from 'zod'

export const loginRequestSchema = z
  .object({
    email: z.string().email('E-mail inválido.').openapi({ example: 'admin@ketris.dev' }),
    password: z
      .string()
      .min(1, 'Senha é obrigatória.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .openapi('LoginRequest')

export type LoginRequestDTO = z.infer<typeof loginRequestSchema>

export const authenticatedUserSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    nome: z.string(),
    email: z.string().email(),
    papel: z.enum(['ADMIN', 'PROPRIETARIO', 'CORRETOR']),
  })
  .openapi('AuthenticatedUser')

export const loginResponseSchema = z
  .object({
    user: authenticatedUserSchema,
    accessToken: z.string().openapi({ description: 'JWT (HS256), válido por 1 hora.' }),
  })
  .openapi('LoginResponse')

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
    }),
  })
  .openapi('ErrorResponse')
