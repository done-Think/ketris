import '@server/openapi/zod-extend'
import { z } from 'zod'

import { locales } from '@/i18n/routing'

export const requestPasswordResetCodeSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .transform((value) => value.toLowerCase())
      .openapi({ example: 'ana@ketris.dev' }),
    locale: z.enum(locales).openapi({ example: 'pt-BR' }),
  })
  .openapi('RequestPasswordResetCodeRequest')

export type RequestPasswordResetCodeDTO = z.infer<typeof requestPasswordResetCodeSchema>

export const verifyPasswordResetCodeSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .transform((value) => value.toLowerCase())
      .openapi({ example: 'ana@ketris.dev' }),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Código deve ter 6 dígitos.')
      .openapi({ example: '123456' }),
  })
  .openapi('VerifyPasswordResetCodeRequest')

export type VerifyPasswordResetCodeDTO = z.infer<typeof verifyPasswordResetCodeSchema>

export const verifyPasswordResetCodeResponseSchema = z
  .object({
    resetToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }),
  })
  .openapi('VerifyPasswordResetCodeResponse')
