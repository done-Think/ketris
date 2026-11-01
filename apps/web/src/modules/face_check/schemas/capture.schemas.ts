import { z } from 'zod'

export const consentSchema = z.object({
  accepted: z.boolean().refine((value) => value, { message: 'consentRequired' }),
})

export type ConsentFormValues = z.infer<typeof consentSchema>

export const alternativeSchema = z.object({
  reason: z.enum(['noCamera', 'accessibility', 'noConsent', 'other']).nullable(),
  contact: z.string().trim().max(120, { message: 'contactTooLong' }),
})

export type AlternativeFormValues = z.infer<typeof alternativeSchema>
