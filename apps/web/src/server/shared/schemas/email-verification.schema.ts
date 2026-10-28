import '@server/openapi/zod-extend'
import { z } from 'zod'

export const pendingEmailVerificationResponseSchema = z
  .object({
    outcome: z.literal('PENDING_EMAIL_VERIFICATION'),
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((value) => value.toLowerCase()),
    tenantId: z.string(),
    emailSent: z.boolean(),
  })
  .openapi('PendingEmailVerificationResponse')
