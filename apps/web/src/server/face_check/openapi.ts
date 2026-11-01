import '@server/openapi/zod-extend'
import { z } from 'zod'
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import {
  alternativeBodySchema,
  consentBodySchema,
  createSessionBodySchema,
  decisionBodySchema,
  idParamsSchema,
  overviewQuerySchema,
  sessionListQuerySchema,
  settingsBodySchema,
  tokenParamsSchema,
} from './schemas/api.schemas'
import { documentRegionsResultSchema } from './schemas/document-import.schemas'
import { livenessProximitySchema } from './schemas/face-match.schemas'

const timestamp = z.string().datetime()
const status = z.enum([
  'CREATED',
  'IN_PROGRESS',
  'SUBMITTED',
  'PROCESSING',
  'RESUBMISSION_REQUESTED',
  'REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'ABANDONED',
])
const challenge = z.enum(['turnLeft', 'turnRight', 'closer'])
const error = z
  .object({
    error: z.object({ code: z.string(), message: z.string(), reason: z.string().optional() }),
  })
  .openapi('FaceCheckError')
const session = z
  .object({
    id: z.string().uuid(),
    propertyId: z.string(),
    purpose: z.enum(['RENT', 'BUY']),
    personName: z.string(),
    cpf: z.string().nullable(),
    reference: z.string().nullable(),
    contact: z.string().nullable(),
    token: z.string(),
    status,
    captureMode: z.literal('camera'),
    createdAt: timestamp,
    updatedAt: timestamp,
    expiresAt: timestamp,
    decidedAt: timestamp.nullable(),
    attemptsUsed: z.number().int(),
    maxAttempts: z.number().int(),
    manualOverrideAllowed: z.boolean().optional(),
    decisionMethod: z.string().nullable().optional(),
    evidenceExpiresAt: timestamp.nullable().optional(),
    evidenceDeletedAt: timestamp.nullable().optional(),
    evidencePurgePending: z.boolean().optional(),
    evidenceHistory: z.array(
      z
        .object({
          id: z.string().uuid(),
          step: z.string(),
          attempt: z.number().int(),
          capturedAt: timestamp,
          status: z.string(),
          deletedAt: timestamp.nullable().optional(),
        })
        .passthrough(),
    ),
    timeline: z.array(
      z
        .object({ id: z.string().uuid(), kind: z.string(), actor: z.string(), at: timestamp })
        .passthrough(),
    ),
  })
  .passthrough()
  .openapi('FaceCheckSession')
const capture = z
  .object({
    token: z.string(),
    agencyName: z.string(),
    reference: z.string().nullable(),
    acceptedDocument: z.enum(['ANY', 'RG', 'CNH', 'RNE']),
    status,
    captureMode: z.literal('camera'),
    allowGalleryUpload: z.boolean(),
    attemptsLeft: z.number().int(),
    maxAttempts: z.number().int(),
    expiresAt: timestamp,
    redoReason: z.string().nullable(),
  })
  .openapi('FaceCheckCaptureSession')
const progress = z
  .object({
    status,
    progress: z.number(),
    attemptsLeft: z.number().int(),
    redoReason: z.string().nullable(),
  })
  .openapi('FaceCheckCaptureStatus')
const photo = z.string().openapi({
  type: 'string',
  format: 'binary',
  description: 'JPEG/PNG, at most 3 MiB and 16 million decoded pixels.',
})
const multipartImage = z.object({ image: photo })
const settings = z
  .object({
    agencyName: z.string(),
    faceMatchThreshold: z.number(),
    maxAttempts: z.number().int(),
    allowGalleryUpload: z.boolean(),
  })
  .openapi('FaceCheckSettings')

export function registerFaceCheckOpenApi(registry: OpenAPIRegistry) {
  const json = (schema: z.ZodTypeAny) => ({ 'application/json': { schema } })
  const errors = Object.fromEntries(
    [400, 401, 403, 404, 409, 410, 413, 422, 429, 503].map((code) => [
      code,
      {
        description:
          'Validation, authorization, expired evidence, busy operation or unavailable dependency. Errors contain no biometric data.',
        content: json(error),
      },
    ]),
  )
  const consoleRoute = (
    method: 'get' | 'post' | 'put',
    path: string,
    summary: string,
    schema: z.ZodTypeAny,
    request?: Parameters<OpenAPIRegistry['registerPath']>[0]['request'],
    responseStatus = 200,
  ) =>
    registry.registerPath({
      method,
      path: `/face_check${path}`,
      summary,
      tags: ['Face Check'],
      security: [{ bearerAuth: [] }],
      request,
      responses: {
        ...errors,
        [responseStatus]: {
          description:
            'Tenant-scoped response. Agents can access only their current property portfolio.',
          content: json(schema),
        },
      },
    })
  const jsonBody = (schema: z.ZodTypeAny) => ({ required: true, content: json(schema) })
  consoleRoute(
    'get',
    '/access',
    'Check current account eligibility for Face Check.',
    z.object({
      allowed: z.literal(true),
      role: z.enum(['OWNER', 'AGENT']),
      accountType: z.enum(['AGENCY', 'BROKER']),
    }),
  )
  consoleRoute(
    'get',
    '/properties',
    'List properties available to this operator.',
    z.array(z.object({ id: z.string(), title: z.string(), address: z.string().optional() })),
  )
  consoleRoute(
    'get',
    '/sessions',
    'List verification sessions in the current property portfolio.',
    z.object({
      items: z.array(session),
      total: z.number().int(),
      counts: z.record(z.number().int()),
    }),
    { query: sessionListQuerySchema },
  )
  consoleRoute(
    'post',
    '/sessions',
    'Request a real verification for a managed property.',
    z.object({ session, captureUrl: z.string().url() }),
    { body: jsonBody(createSessionBodySchema) },
    201,
  )
  consoleRoute(
    'get',
    '/sessions/{id}',
    'Read a verification and its audit metadata.',
    z.object({ session }),
    { params: idParamsSchema },
  )
  for (const action of ['reopen', 'evidence-view'] as const) {
    consoleRoute(
      'post',
      `/sessions/{id}/${action}`,
      action === 'reopen'
        ? 'Request a new capture without reviving deleted images.'
        : 'Audit the current operator viewing retained evidence.',
      z.object({ session }),
      { params: idParamsSchema },
    )
  }
  consoleRoute(
    'post',
    '/sessions/{id}/decision',
    'Record a human decision and queue immediate evidence deletion. Overrides require explicit acknowledgement, reason and justification.',
    z.object({ session }),
    { params: idParamsSchema, body: jsonBody(decisionBodySchema) },
  )
  registry.registerPath({
    method: 'get',
    path: '/face_check/sessions/{id}/evidence/{kind}',
    tags: ['Face Check'],
    summary:
      'Read a retained image after current portfolio authorization. Never returns a public URL.',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamsSchema.extend({
        kind: z.union([z.enum(['front', 'back', 'selfie']), z.string().uuid()]),
      }),
    },
    responses: {
      ...errors,
      200: {
        description: 'Private image, no-store. Terminal or expired evidence is unavailable.',
        content: {
          'image/jpeg': { schema: z.string().openapi({ type: 'string', format: 'binary' }) },
          'image/png': { schema: z.string().openapi({ type: 'string', format: 'binary' }) },
        },
      },
    },
  })
  consoleRoute(
    'get',
    '/metrics/overview',
    'Summarize real verifications in the operator portfolio.',
    z
      .object({
        completed: z.number(),
        autoApproved: z.number(),
        autoApprovalRate: z.number(),
        inReview: z.number(),
        redoRequests: z.number(),
        medianDecisionSeconds: z.number().nullable(),
        oldestReviewAt: timestamp.nullable(),
        daily: z.array(
          z.object({
            day: z.string(),
            approved: z.number(),
            rejected: z.number().optional(),
            redo: z.number(),
            review: z.number(),
          }),
        ),
        reviewQueue: z.array(session),
      })
      .passthrough(),
    { query: overviewQuerySchema },
  )
  consoleRoute(
    'get',
    '/settings',
    'Read tenant settings. Automatic biometric approval is disabled.',
    settings,
  )
  consoleRoute(
    'put',
    '/settings',
    'Update tenant settings. Only OWNER can write; the agency name comes from the account.',
    settings,
    { body: jsonBody(settingsBodySchema) },
  )
  const captureRoute = (
    method: 'get' | 'post',
    suffix: string,
    summary: string,
    schema?: z.ZodTypeAny,
    body?: z.ZodTypeAny,
    multipart = false,
  ) =>
    registry.registerPath({
      method,
      path: `/face_check/capture/{token}${suffix}`,
      tags: ['Face Check Capture'],
      summary,
      description:
        'The single-session capture token is the credential. Expiration, current requester/property eligibility, origin and distributed rate limits are checked server-side.',
      security: [],
      request: {
        params: tokenParamsSchema,
        ...(body
          ? {
              body: {
                required: true,
                content: {
                  [multipart ? 'multipart/form-data' : 'application/json']: { schema: body },
                },
              },
            }
          : {}),
      },
      responses: {
        ...errors,
        [schema ? 200 : 204]: {
          description: schema ? 'Capture response.' : 'Capture accepted.',
          ...(schema ? { content: json(schema) } : {}),
        },
      },
    })
  captureRoute('get', '', 'Read the invited capture session.', capture)
  captureRoute(
    'post',
    '/consent',
    'Record explicit acceptance of the versioned privacy and deletion notice.',
    capture,
    consentBodySchema,
  )
  captureRoute(
    'post',
    '/document',
    'Inspect and store a document side privately.',
    undefined,
    z.object({
      image: photo,
      side: z.enum(['front', 'back']),
      documentType: z.enum(['RG', 'CNH', 'RNE']),
    }),
    true,
  )
  captureRoute(
    'get',
    '/challenges',
    'Get the server-issued movement sequence.',
    z.object({ challenges: z.array(challenge) }),
  )
  captureRoute(
    'post',
    '/liveness',
    'Inspect the baseline selfie.',
    undefined,
    z.object({ selfie: photo }),
    true,
  )
  captureRoute(
    'post',
    '/liveness-frame',
    'Check one issued movement in the permitted order and time window.',
    z.object({ remaining: z.number().int() }),
    z.object({ image: photo, challenge }),
    true,
  )
  captureRoute(
    'post',
    '/proximity',
    'Check face proximity for the active challenge.',
    livenessProximitySchema,
    multipartImage,
    true,
  )
  captureRoute(
    'post',
    '/document-regions',
    'Suggest document crops without approving identity.',
    documentRegionsResultSchema,
    multipartImage,
    true,
  )
  captureRoute(
    'post',
    '/submit',
    'Submit complete captures for server analysis and human review.',
    progress,
  )
  captureRoute('get', '/status', 'Read the actual verification status.', progress)
  captureRoute(
    'post',
    '/alternative',
    'Request explicit human assistance.',
    capture,
    alternativeBodySchema,
  )
}
