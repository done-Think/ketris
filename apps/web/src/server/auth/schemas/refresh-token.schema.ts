import '@server/openapi/zod-extend'
import { z } from 'zod'

export const refreshTokenRequestSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token é obrigatório.'),
  })
  .strict()
  .openapi('RefreshTokenRequest')

export const refreshTokenResponseSchema = z
  .object({
    accessToken: z.string().openapi({ description: 'Novo JWT (HS256), válido por 1 hora.' }),
    refreshToken: z
      .string()
      .openapi({ description: 'Novo refresh token — o anterior foi revogado (rotação).' }),
  })
  .openapi('RefreshTokenResponse')
