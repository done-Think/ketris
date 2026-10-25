import '@server/openapi/zod-extend'
import { z } from 'zod'

import { locales } from '@/i18n/routing'
import { isSupportedNewPasswordLength } from '@shared/utils/password-length'
import { pendingEmailVerificationResponseSchema } from '@server/auth/schemas/email-verification.schema'

const registerBaseFields = {
  fullName: z.string().trim().min(3, 'Informe o nome completo.').max(200),
  email: z
    .string()
    .trim()
    .max(254)
    .email('E-mail inválido.')
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((value) => {
      const digits = value.replace(/\D/g, '')
      return digits.length === 10 || digits.length === 11
    }, 'Telefone inválido.'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres.')
    .refine(isSupportedNewPasswordLength, 'Senha deve ter no máximo 72 bytes.'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar os termos.' }),
  }),
  locale: z.enum(locales).default('pt-BR'),
}

export const registerRequestSchema = z
  .discriminatedUnion('profile', [
    z
      .object({
        ...registerBaseFields,
        profile: z.enum(['proprietario', 'imobiliaria', 'construtora']),
        companyName: z.string().trim().min(1).optional(),
      })
      .strict(),
    z
      .object({
        ...registerBaseFields,
        profile: z.literal('corretor'),
        companyName: z.string().trim().min(1).optional(),
        agencyId: z.string().trim().min(1).optional(),
        creci: z.string().trim().min(1, 'CRECI é obrigatório.').max(32),
      })
      .strict(),
    z.object({ ...registerBaseFields, profile: z.literal('locatario') }).strict(),
  ])
  .openapi('RegisterRequest')

export const registerResponseSchema =
  pendingEmailVerificationResponseSchema.openapi('RegisterResponse')
