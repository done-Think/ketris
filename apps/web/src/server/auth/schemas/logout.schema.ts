import '@server/openapi/zod-extend'
import { z } from 'zod'

export const logoutRequestSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token é obrigatório.'),
  })
  .openapi('LogoutRequest')

export type LogoutRequestDTO = z.infer<typeof logoutRequestSchema>
