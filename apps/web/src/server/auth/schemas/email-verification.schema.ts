import '@server/openapi/zod-extend'
import { z } from 'zod'

import { locales } from '@/i18n/routing'
import { authenticatedUserResponseSchema } from './user.schema'

const email = z
  .string()
  .trim()
  .max(254)
  .email()
  .transform((value) => value.toLowerCase())
const code = z
  .string()
  .trim()
  .regex(/^\d{6}$/)

export const requestSignupVerificationSchema = z
  .object({
    email,
    tenantId: z.string().trim().min(1),
    locale: z.enum(locales),
  })
  .strict()
  .openapi('RequestSignupVerification')

export const confirmSignupVerificationSchema = z
  .object({
    email,
    tenantId: z.string().trim().min(1),
    code,
  })
  .strict()
  .openapi('ConfirmSignupVerification')

export const requestEmailChangeSchema = z
  .object({ email, locale: z.enum(locales) })
  .strict()
  .openapi('RequestEmailChange')
export const confirmEmailChangeSchema = z
  .object({ email, code })
  .strict()
  .openapi('ConfirmEmailChange')

export { pendingEmailVerificationResponseSchema } from '@server/shared/schemas/email-verification.schema'

export const confirmSignupVerificationResponseSchema = z
  .discriminatedUnion('outcome', [
    z.object({
      outcome: z.literal('REGISTERED'),
      user: authenticatedUserResponseSchema,
      accessToken: z.string(),
      refreshToken: z.string(),
    }),
    z.object({ outcome: z.literal('PENDING_APPROVAL'), email }),
  ])
  .openapi('ConfirmSignupVerificationResponse')

export const publicConfirmEmailChangeSchema = z
  .object({
    requestId: z.string().trim().min(1),
    code,
  })
  .strict()
  .openapi('PublicConfirmEmailChange')
