import '@server/openapi/zod-extend'
import { z } from 'zod'

export const resetPasswordRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .transform((value) => value.toLowerCase())
      .openapi({ example: 'ana@ketris.dev' }),
    password: z
      .string()
      .min(8, 'Senha deve ter pelo menos 8 caracteres.')
      .openapi({ example: 'trocar-em-desenvolvimento' }),
  })
  .openapi('ResetPasswordRequest')

export type ResetPasswordRequestDTO = z.infer<typeof resetPasswordRequestSchema>
