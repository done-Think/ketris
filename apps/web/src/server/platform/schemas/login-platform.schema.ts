import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const loginPlatformRequestSchema = z
  .object({
    email: z.string().email('E-mail inválido.').openapi({ example: 'alysson@ketris.dev' }),
    password: z
      .string()
      .min(1, 'Senha é obrigatória.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .openapi('LoginPlatformRequest')

export type LoginPlatformRequestDTO = z.infer<typeof loginPlatformRequestSchema>

export const loginPlatformResponseSchema = z
  .object({
    admin: authenticatedPlatformAdminSchema,
    accessToken: z.string().openapi({ description: 'JWT (HS256), válido por 1 hora.' }),
    refreshToken: z.string().openapi({
      description:
        'Token opaco de alta entropia, válido por 30 dias. Use em POST /platform/refresh para obter um novo access token.',
    }),
  })
  .openapi('LoginPlatformResponse')
