import '@server/openapi/zod-extend'
import { z } from 'zod'

import { tenantSelectionResponseSchema } from './login.schema'
import { locales } from '@/i18n/routing'

export const requestPasswordResetCodeSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .max(254, 'E-mail inválido.')
      .transform((value) => value.toLowerCase())
      .openapi({ example: 'ana@ketris.dev' }),
    locale: z.enum(locales).openapi({ example: 'pt-BR' }),
  })
  .strict()
  .openapi('RequestPasswordResetCodeRequest')

export const verifyPasswordResetCodeSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('E-mail inválido.')
      .max(254, 'E-mail inválido.')
      .transform((value) => value.toLowerCase())
      .openapi({ example: 'ana@ketris.dev' }),
    tenantId: z.string().trim().min(1).optional(),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Código deve ter 6 dígitos.')
      .openapi({ example: '123456' }),
  })
  .strict()
  .openapi('VerifyPasswordResetCodeRequest')

export const verifyPasswordResetCodeResponseSchema = z
  .union([
    z.object({ resetToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiJ9...' }) }),
    tenantSelectionResponseSchema,
  ])
  .openapi('VerifyPasswordResetCodeResponse')
