import { validationRefinement } from '@server/shared/http/validation-messages'
import '@server/openapi/zod-extend'
import { z } from 'zod'

import { locales } from '@/i18n/routing'
import { isSupportedNewPasswordLength } from '@shared/utils/password-length'
import { pendingEmailVerificationResponseSchema } from '@server/shared/schemas/email-verification.schema'

const registerBaseFields = {
  fullName: z.string().trim().min(3).max(200),
  email: z
    .string()
    .trim()
    .max(254)
    .email()
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((value) => {
      const digits = value.replace(/\D/g, '')
      return digits.length === 10 || digits.length === 11
    }, validationRefinement('phoneInvalid')),
  password: z
    .string()
    .min(8)
    .refine(isSupportedNewPasswordLength, validationRefinement('passwordBytes')),
  acceptTerms: z
    .boolean()
    .refine((value) => value, validationRefinement('termsRequired'))
    .transform(() => true as const)
    .openapi({ type: 'boolean', enum: [true] }),
  locale: z.enum(locales).default('pt-BR'),
}

export const registerRequestSchema = z
  .discriminatedUnion('profile', [
    z
      .object({
        ...registerBaseFields,
        profile: z.enum(['owner', 'agency', 'developer']),
        companyName: z.string().trim().min(1).optional(),
      })
      .strict(),
    z
      .object({
        ...registerBaseFields,
        profile: z.literal('broker'),
        companyName: z.string().trim().min(1).optional(),
        agencyId: z.string().trim().min(1).optional(),
        creci: z.string().trim().min(1).max(32),
      })
      .strict(),
    z.object({ ...registerBaseFields, profile: z.literal('renter') }).strict(),
  ])
  .openapi('RegisterRequest')

export const registerResponseSchema =
  pendingEmailVerificationResponseSchema.openapi('RegisterResponse')
