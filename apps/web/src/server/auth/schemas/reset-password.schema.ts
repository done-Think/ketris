import '@server/openapi/zod-extend'
import { z } from 'zod'
import { createNewPasswordSchema } from '@shared/schemas/new-password-schema'

export const resetPasswordRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .max(254, 'E-mail inválido.')
      .transform((value) => value.toLowerCase())
      .openapi({ example: 'ana@ketris.dev' }),
    tenantId: z.string().trim().min(1).optional(),
    password: createNewPasswordSchema((key) =>
      key === 'passwordTooLong'
        ? 'Senha muito longa. Use menos caracteres.'
        : 'Senha deve ter pelo menos 8 caracteres.',
    ).openapi({ example: 'trocar-em-desenvolvimento' }),
    resetToken: z.string().min(1, 'Token de redefinição é obrigatório.').openapi({
      example: 'eyJhbGciOiJIUzI1NiJ9...',
    }),
  })
  .strict()
  .openapi('ResetPasswordRequest')
