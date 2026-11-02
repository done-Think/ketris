import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@server/db/prisma'
import { getTrustedClientAddress } from '@server/security/client-key'
import { resolveRequestLocale } from '@server/shared/http/request-locale'
import { requireFaceCheckActor } from '../require-face-check-actor'
import { PrismaFaceCheckPropertyCatalog } from '../infrastructure/prisma-property-catalog'
import { captureTokenHash, DataCipher } from '../infrastructure/data-cipher'
import { CaptureRateLimit } from '../infrastructure/capture-rate-limit'
import { faceCheckContainer } from '../container'
import { attemptCreatedFaceCheckInvitationEmail } from '../invitation-emails'
import {
  alternativeBodySchema,
  consentBodySchema,
  createSessionBodySchema,
  decisionBodySchema,
  documentImageFormSchema,
  documentRegionsFormSchema,
  evidenceParamsSchema,
  idParamsSchema,
  livenessFrameFormSchema,
  livenessProximityFormSchema,
  startLivenessBodySchema,
  prepareLivenessBodySchema,
  overviewQuerySchema,
  selfieImageFormSchema,
  sessionListQuerySchema,
  settingsBodySchema,
  tokenParamsSchema,
} from '../schemas/api.schemas'
import { capturedImage, assertMutationOrigin, jsonBody, photoForm } from './request'
import { buildCaptureUrl } from './capture-url'
import { withFaceCheckErrors } from './with-face-check-errors'
import { FaceCheckError } from './errors'

export interface FaceCheckRouteContext {
  params: Promise<Record<string, string>>
}
type ConsoleOperation =
  | 'properties'
  | 'sessions-list'
  | 'sessions-create'
  | 'session'
  | 'decision'
  | 'reopen'
  | 'evidence-view'
  | 'evidence'
  | 'overview'
  | 'settings-get'
  | 'settings-put'
type CaptureOperation =
  | 'framing'
  | 'capture'
  | 'consent'
  | 'document'
  | 'challenges'
  | 'liveness'
  | 'liveness-frame'
  | 'liveness-start'
  | 'liveness-plan'
  | 'proximity'
  | 'document-regions'
  | 'submit'
  | 'status'
  | 'alternative'

export function consoleHandler(operation: ConsoleOperation) {
  return withFaceCheckErrors(async (request: NextRequest, context: FaceCheckRouteContext) => {
    assertMutationOrigin(request, false)
    const actor = await requireFaceCheckActor(request)
    if (operation === 'properties')
      return NextResponse.json(await new PrismaFaceCheckPropertyCatalog(prisma).list(actor))
    if (operation === 'settings-put' && actor.role !== 'OWNER')
      throw new FaceCheckError('FORBIDDEN', 403)
    const container = await faceCheckContainer({ actor }, prisma, {
      invitationLocale: resolveRequestLocale(request),
    })
    switch (operation) {
      case 'sessions-list': {
        const query = sessionListQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        )
        return NextResponse.json(
          await container.listSessionsUseCase.execute({
            filter: query.filter,
            search: query.q,
            page: query.page,
            pageSize: query.pageSize,
          }),
        )
      }
      case 'sessions-create': {
        const body = await jsonBody(request, createSessionBodySchema)
        // Validate the configured public URL before creating a durable session.
        buildCaptureUrl(request, '0'.repeat(64))
        const session = await container.createSessionUseCase.execute(body)
        await attemptCreatedFaceCheckInvitationEmail(session.id)
        return NextResponse.json(
          { session, captureUrl: buildCaptureUrl(request, session.token) },
          { status: 201 },
        )
      }
      case 'overview': {
        const { scope } = overviewQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        )
        return NextResponse.json(await container.getOverviewUseCase.execute(scope))
      }
      case 'settings-get':
        return NextResponse.json(await container.getSettingsUseCase.execute())
      case 'settings-put': {
        const input = await jsonBody(request, settingsBodySchema)
        return NextResponse.json(
          await container.updateSettingsUseCase.execute({ ...input, agencyName: actor.agencyName }),
        )
      }
    }
    const params = await context.params
    const { id } = idParamsSchema.parse(params)
    if (operation === 'evidence') {
      const { kind } = evidenceParamsSchema.parse(params)
      const image = await container.getEvidenceUseCase.execute(id, kind)
      return new NextResponse(
        new Blob([new Uint8Array(image.bytes)], { type: image.contentType }),
        {
          headers: {
            'Content-Type': image.contentType,
            'Content-Disposition': 'inline',
            'Content-Security-Policy': "default-src 'none'; sandbox",
          },
        },
      )
    }
    if (operation === 'session') {
      let session = await container.getSessionUseCase.execute(id)
      if (session.status === 'PROCESSING') {
        await container.analyzeSessionUseCase.execute(id)
        session = await container.getSessionUseCase.execute(id)
      }
      return NextResponse.json({ session })
    }
    if (operation === 'decision')
      return NextResponse.json({
        session: await container.decideSessionUseCase.execute(
          id,
          await jsonBody(request, decisionBodySchema),
        ),
      })
    if (operation === 'reopen')
      return NextResponse.json({ session: await container.reopenSessionUseCase.execute(id) })
    if (operation === 'evidence-view')
      return NextResponse.json({ session: await container.recordEvidenceViewUseCase.execute(id) })
    throw new FaceCheckError('SESSION_NOT_FOUND', 404)
  })
}

export function captureHandler(operation: CaptureOperation) {
  return withFaceCheckErrors(async (request: NextRequest, context: FaceCheckRouteContext) => {
    assertMutationOrigin(request, true)
    const { token } = tokenParamsSchema.parse(await context.params)
    DataCipher.fromEnvironment()
    const limiter = new CaptureRateLimit(
      prisma,
      Buffer.from(process.env.FACE_CHECK_DATA_ENCRYPTION_KEY!, 'base64'),
    )
    const upload = [
      'document',
      'liveness',
      'liveness-frame',
      'proximity',
      'document-regions',
    ].includes(operation)
    await limiter.consume(
      getTrustedClientAddress(request.headers),
      token,
      operation === 'framing' ? 'feedback' : upload,
    )
    const container = await faceCheckContainer({ token })
    if (operation === 'capture')
      return NextResponse.json(await container.getCaptureSessionUseCase.execute(token))
    if (operation === 'consent')
      return NextResponse.json(
        await container.consentUseCase.execute(token, await jsonBody(request, consentBodySchema)),
      )
    if (operation === 'alternative')
      return NextResponse.json(
        await container.requestAlternativeUseCase.execute(
          token,
          await jsonBody(request, alternativeBodySchema),
        ),
      )
    if (operation === 'challenges')
      return NextResponse.json({ challenges: await container.getChallengesUseCase.execute(token) })
    if (operation === 'liveness-start') {
      const body = await jsonBody(request, startLivenessBodySchema)
      return NextResponse.json(await container.startLivenessUseCase.execute(token, body.planId))
    }
    if (operation === 'liveness-plan') {
      const body = await jsonBody(request, prepareLivenessBodySchema)
      return NextResponse.json(await container.prepareLivenessUseCase.execute(token, body.restart))
    }
    if (operation === 'submit') {
      const body = await jsonBody(request, startLivenessBodySchema)
      await container.submitCaptureUseCase.execute(token, body.planId)
      return NextResponse.json(await container.getCaptureStatusUseCase.execute(token))
    }
    if (operation === 'status') {
      const status = await container.getCaptureStatusUseCase.execute(token)
      if (status.status === 'PROCESSING') {
        const row = await prisma.faceCheckSession.findUnique({
          where: { tokenHash: captureTokenHash(token) },
          select: { id: true },
        })
        if (row) await container.analyzeSessionUseCase.execute(row.id)
        return NextResponse.json(await container.getCaptureStatusUseCase.execute(token))
      }
      return NextResponse.json(status)
    }
    // All count and scope checks precede reading or decoding the multipart request.
    const form = await photoForm(request)
    if (operation === 'framing') {
      const body = livenessProximityFormSchema.strict().parse(form)
      const image = await capturedImage(body.image, {
        maxBytes: 512 * 1024,
        maxPixels: 1024 * 1024,
      })
      return NextResponse.json(await container.selfieFramingUseCase.execute(token, image.bytes))
    }
    if (operation === 'document') {
      const body = documentImageFormSchema.strict().parse(form)
      await container.uploadDocumentPhotoUseCase.execute(
        token,
        body.side,
        body.documentType,
        await capturedImage(body.image),
        body.planId,
      )
      return new NextResponse(null, { status: 204 })
    }
    if (operation === 'liveness') {
      const body = selfieImageFormSchema.strict().parse(form)
      await container.uploadSelfieUseCase.execute(
        token,
        await capturedImage(body.selfie),
        body.planId,
      )
      return new NextResponse(null, { status: 204 })
    }
    if (operation === 'liveness-frame') {
      const body = livenessFrameFormSchema.strict().parse(form)
      return NextResponse.json(
        await container.verifyLivenessFrameUseCase.execute(
          token,
          body.challenge,
          await capturedImage(body.image),
          body.planId,
        ),
      )
    }
    if (operation === 'proximity') {
      const body = livenessProximityFormSchema.strict().parse(form)
      return NextResponse.json(
        await container.livenessProximityUseCase.execute(
          token,
          (await capturedImage(body.image)).bytes,
        ),
      )
    }
    if (operation === 'document-regions') {
      const body = documentRegionsFormSchema.strict().parse(form)
      return NextResponse.json(
        await container.documentRegionsUseCase.execute(
          token,
          (await capturedImage(body.image)).bytes,
        ),
      )
    }
    throw new FaceCheckError('INVALID_CAPTURE_STATE', 409)
  })
}
