import '@server/openapi/zod-extend'
import { z } from 'zod'

import { authenticatedPlatformAdminSchema } from './platform-admin.schema'

export const loginPlatformRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254, 'E-mail inválido.')
      .email('E-mail inválido.')
      .openapi({ example: 'alysson@ketris.dev' }),
    password: z
      .string()
      .min(1, 'Senha é obrigatória.')
      .max(128, 'Senha muito longa.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .strict()
  .openapi('LoginPlatformRequest')

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
