import { z } from 'zod'

export const faceFramingSchema = z
  .object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    faceCount: z.number().int().min(0).max(10),
    face: z
      .object({
        x: z.number().finite().min(-2).max(2),
        y: z.number().finite().min(-2).max(2),
        width: z.number().finite().positive().max(4),
        height: z.number().finite().positive().max(4),
      })
      .nullable(),
  })
  .refine((result) => (result.faceCount === 0) === (result.face === null))

export const livenessProximitySchema = z.object({
  ready: z.boolean(),
  closerRatio: z.number().finite().positive().nullable(),
})

const detectedFaceSchema = z.object({
  opened: z.boolean(),
  facesFound: z.number().int().min(0),
  detectionScore: z.number().nullable(),
  interocularPx: z.number().nullable(),
})

export const faceMatchResultSchema = z.object({
  similarity: z.number().nullable(),
  document: detectedFaceSchema,
  selfie: detectedFaceSchema,
})

const liveScoreSchema = z
  .number()
  .min(0)
  .max(1)
  .nullish()
  .transform((value) => value ?? null)

const photoIssueSchema = z.enum([
  'unreadable',
  'lowResolution',
  'documentFaceNotFound',
  'looksLikeSelfie',
  'selfieFaceNotFound',
  'multipleFaces',
  'faceTooSmall',
  'tooDark',
  'tooBright',
  'blurry',
  'duplicatePhoto',
  'looksLikeDocument',
  'documentTextNotFound',
  'documentShapeNotFound',
  'spoofSuspected',
])

const documentReadingSchema = z
  .object({
    cardDetected: z.boolean(),
    documentType: z.enum(['RG', 'CNH', 'RNE']).nullable(),
    cpfRead: z.boolean(),
    cpfMatches: z.boolean().nullable(),
    nameFound: z.boolean().nullable(),
  })
  .nullish()
  .transform((value) => value ?? null)

const limitsSchema = z.record(z.string(), z.number()).default({})

const photoMetricsSchema = z.object({
  width: z.number(),
  height: z.number(),
  brightness: z.number(),
  brightnessSource: z.enum(['image', 'text']).optional(),
  sharpness: z.number(),
  textRegions: z.number().int().min(0),
  realProbability: z.number().nullable(),
  faces: z.array(z.object({ areaRatio: z.number(), interocularPx: z.number() })),
})

export const photoInspectionSchema = z
  .object({
    issues: z.array(photoIssueSchema),
    hashes: z.array(z.string().regex(/^[0-9a-f]{64}$/)),
    liveScore: liveScoreSchema,
    document: documentReadingSchema,
    metrics: photoMetricsSchema.nullish(),
    limits: limitsSchema,
  })
  .transform(({ metrics, limits, ...inspection }) => {
    const largest = metrics?.faces.reduce<(typeof metrics.faces)[number] | null>(
      (best, face) => (!best || face.areaRatio > best.areaRatio ? face : best),
      null,
    )

    return {
      ...inspection,
      diagnostics: metrics
        ? {
            kind: 'photo' as const,
            width: metrics.width,
            height: metrics.height,
            brightness: metrics.brightness,
            ...(metrics.brightnessSource ? { brightnessSource: metrics.brightnessSource } : {}),
            sharpness: metrics.sharpness,
            textRegions: metrics.textRegions,
            facesFound: metrics.faces.length,
            largestFaceRatio: largest?.areaRatio ?? null,
            largestFaceInterocularPx: largest?.interocularPx ?? null,
            realProbability: metrics.realProbability,
            limits,
          }
        : null,
    }
  })

const livenessFrameSchema = z.object({
  yawDelta: z.number().nullable(),
  closerRatio: z.number().nullable(),
  similarity: z.number().nullable(),
  realProbability: z.number().nullable(),
})

export const livenessResultSchema = z
  .object({
    passed: z.boolean(),
    issues: z.array(
      z.enum([
        'livenessFaceNotFound',
        'livenessDifferentPerson',
        'livenessNotTurned',
        'livenessNotCloser',
        'livenessSpoofSuspected',
      ]),
    ),
    liveScore: liveScoreSchema,
    frames: z.array(livenessFrameSchema).default([]),
    limits: limitsSchema,
  })
  .transform(({ frames, limits, ...result }) => ({
    ...result,
    diagnostics: frames[0] ? { kind: 'liveness' as const, ...frames[0], limits } : null,
  }))
