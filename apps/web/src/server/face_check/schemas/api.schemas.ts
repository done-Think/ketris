import { z } from 'zod'

import { maxCapturePhotoBytes } from '@server/face_check/config/upload-limits'
import { similarityPolicy } from '@server/face_check/config/similarity-policy'
import { isValidCpf } from '@server/face_check/utils/cpf'
import { invitationEmailSchema } from './invitation-email.schemas'

const documentType = z.enum(['RG', 'CNH', 'RNE'])
const capturePlanId = z.string().uuid().optional()
export const startLivenessBodySchema = z.object({ planId: capturePlanId }).strict()
export const prepareLivenessBodySchema = z.object({ restart: z.boolean().optional() }).strict()

export const tokenParamsSchema = z.object({
  token: z
    .string()
    .trim()
    .length(64)
    .max(64)
    .regex(/^[a-f0-9]{64}$/),
})

export const idParamsSchema = z.object({ id: z.string().uuid() })

export const candidateVerificationCountsSchema = z
  .object({ count: z.number().int().min(0), pendingCount: z.number().int().min(0) })
  .strict()

export const documentUploadBodySchema = z.object({
  side: z.enum(['front', 'back']),
  documentType,
  planId: capturePlanId,
})

const acceptedImageTypes = ['image/jpeg', 'image/png']

const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0 && file.size <= maxCapturePhotoBytes)
  .refine((file) => acceptedImageTypes.includes(file.type))

export const documentImageFormSchema = documentUploadBodySchema.extend({ image: imageFileSchema })

export const selfieImageFormSchema = z.object({ selfie: imageFileSchema, planId: capturePlanId })
export const documentRegionsFormSchema = z.object({ image: imageFileSchema })
export const livenessProximityFormSchema = z.object({ image: imageFileSchema })

export const livenessFrameFormSchema = z.object({
  planId: capturePlanId,
  challenge: z.enum(['turnLeft', 'turnRight', 'closer']),
  image: imageFileSchema,
})

export const evidenceParamsSchema = idParamsSchema.extend({
  kind: z.union([z.enum(['front', 'back', 'selfie']), z.string().uuid()]),
})

export const alternativeBodySchema = z
  .object({
    reason: z.enum(['noCamera', 'accessibility', 'noConsent', 'other']).nullable(),
    contact: z.string().trim().max(120),
  })
  .strict()

export const sessionListQuerySchema = z.object({
  filter: z
    .enum(['all', 'review', 'open', 'redo', 'approved', 'rejected', 'closed'])
    .default('all'),
  q: z.string().trim().max(80).default(''),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

export const createSessionBodySchema = z
  .object({
    propertyId: z.string().trim().min(1).max(100),
    purpose: z.enum(['RENT', 'BUY']).default('RENT'),
    personName: z.string().trim().min(2).max(80),
    cpf: z
      .string()
      .trim()
      .default('')
      .refine((value) => value === '' || isValidCpf(value)),
    reference: z.string().trim().max(60),
    contact: invitationEmailSchema,
    acceptedDocument: z.enum(['ANY', 'RG', 'CNH', 'RNE']),
    expiresInHours: z.union([z.literal(24), z.literal(48), z.literal(168)]),
  })
  .strict()

export const decisionBodySchema = z
  .object({
    decision: z.enum(['approve', 'redo', 'reject']),
    manualOverride: z.boolean().optional(),
    reason: z.enum(['match', 'mismatch', 'illegible', 'tampered', 'liveness']).nullable(),
    note: z.string().trim().max(500),
  })
  .strict()
  .refine(
    (body) =>
      !body.manualOverride ||
      (body.decision === 'approve' && body.reason !== null && body.note.trim().length >= 10),
    { path: ['note'] },
  )
  .refine((body) => body.decision === 'approve' || body.reason !== null, {
    path: ['reason'],
  })

export const settingsBodySchema = z
  .object({
    agencyName: z.string().trim().max(160).optional(),
    faceMatchThreshold: z.number().min(similarityPolicy.approveAbove).max(0.9),
    maxAttempts: z.number().int().min(1).max(5),
    allowGalleryUpload: z.boolean(),
  })
  .strict()

export const consentBodySchema = z
  .object({
    accepted: z.literal(true),
    termsVersion: z.string().trim().min(1).max(40),
  })
  .strict()

export const overviewQuerySchema = z.object({
  scope: z.literal('real').default('real'),
})
