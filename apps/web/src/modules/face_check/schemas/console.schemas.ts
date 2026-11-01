import { z } from 'zod'

import { similarityPolicy } from '../utils/similarity-policy'
import { isValidCpf } from '../utils/cpf'

export const newVerificationSchema = z.object({
  propertyId: z.string().trim().min(1, { message: 'propertyRequired' }),
  purpose: z.enum(['RENT', 'BUY']),
  personName: z.string().trim().min(2, { message: 'nameRequired' }).max(80, { message: 'tooLong' }),
  cpf: z
    .string()
    .trim()
    .refine((value) => value === '' || isValidCpf(value), { message: 'cpfInvalid' }),
  reference: z.string().trim().max(60, { message: 'tooLong' }),
  contact: z.string().trim().max(120, { message: 'tooLong' }),
  acceptedDocument: z.enum(['ANY', 'RG', 'CNH', 'RNE']),
  expiresInHours: z.union([z.literal(24), z.literal(48), z.literal(168)]),
})

export type NewVerificationFormValues = z.infer<typeof newVerificationSchema>

export const createDecisionSchema = (manualOverrideRequired = false) =>
  z
    .object({
      decision: z.enum(['approve', 'redo', 'reject']).nullable(),
      reason: z.enum(['match', 'mismatch', 'illegible', 'tampered', 'liveness']).nullable(),
      note: z.string().trim().max(500, { message: 'tooLong' }),
      manualOverride: z.boolean().default(false),
      reviewedEvidence: z.boolean().default(false),
    })
    .superRefine((values, context) => {
      if (!values.decision) {
        context.addIssue({ code: 'custom', path: ['decision'], message: 'decisionRequired' })
      }
      if ((values.decision === 'redo' || values.decision === 'reject') && !values.reason) {
        context.addIssue({ code: 'custom', path: ['reason'], message: 'reasonRequired' })
      }
      if (values.decision === 'approve' && manualOverrideRequired && !values.manualOverride) {
        context.addIssue({
          code: 'custom',
          path: ['manualOverride'],
          message: 'manualOverrideRequired',
        })
      }
      if (values.decision === 'approve' && values.manualOverride) {
        if (!values.reason)
          context.addIssue({ code: 'custom', path: ['reason'], message: 'reasonRequired' })
        if (values.note.length < 10)
          context.addIssue({
            code: 'custom',
            path: ['note'],
            message: 'manualOverrideNoteRequired',
          })
        if (!values.reviewedEvidence)
          context.addIssue({
            code: 'custom',
            path: ['reviewedEvidence'],
            message: 'evidenceReviewRequired',
          })
      }
    })

export const decisionSchema = createDecisionSchema()

export type DecisionFormValues = z.infer<typeof decisionSchema>

export const sessionSearchSchema = z.object({
  search: z.string().trim().max(80, { message: 'tooLong' }),
})

export type SessionSearchFormValues = z.infer<typeof sessionSearchSchema>

export const settingsSchema = z.object({
  agencyName: z.string().trim().max(160, { message: 'tooLong' }),
  faceMatchThreshold: z.number().min(similarityPolicy.approveAbove).max(0.9),
  maxAttempts: z.number().int().min(1).max(5),
  allowGalleryUpload: z.boolean(),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
