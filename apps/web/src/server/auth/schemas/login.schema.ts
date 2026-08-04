import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedUserSchema } from './user.schema'

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

export const loginResponseSchema = z
  .object({
    user: authenticatedUserSchema,
    accessToken: z.string().openapi({ description: 'JWT (HS256), válido por 1 hora.' }),
    refreshToken: z
      .string()
      .openapi({
        description:
          'Token opaco de alta entropia, válido por 30 dias. Use em POST /auth/refresh para obter um novo access token.',
      }),
  })
  .openapi('LoginResponse')
