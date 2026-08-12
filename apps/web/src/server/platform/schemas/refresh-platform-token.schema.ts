import '@server/openapi/zod-extend'
import { z } from 'zod'

export const refreshPlatformTokenRequestSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token é obrigatório.'),
  })
  .openapi('RefreshPlatformTokenRequest')

export type RefreshPlatformTokenRequestDTO = z.infer<typeof refreshPlatformTokenRequestSchema>

export const refreshPlatformTokenResponseSchema = z
  .object({
    accessToken: z.string().openapi({ description: 'Novo JWT (HS256), válido por 1 hora.' }),
    refreshToken: z
      .string()
      .openapi({ description: 'Novo refresh token — o anterior foi revogado (rotação).' }),
  })
  .openapi('RefreshPlatformTokenResponse')
