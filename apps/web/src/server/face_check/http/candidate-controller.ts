import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@server/db/prisma'
import { requireFaceCheckCandidate } from '../require-face-check-candidate'
import { PrismaCandidateVerificationRepository } from '../infrastructure/prisma-candidate-verification-repository'
import {
  GetFaceCheckAccessUseCase,
  GetMyFaceCheckVerificationCountsUseCase,
  ListMyFaceCheckVerificationsUseCase,
} from '../verification/application/use-cases/candidate-verifications'
import { buildCaptureUrl } from './capture-url'
import { withFaceCheckErrors } from './with-face-check-errors'

export const faceCheckAccessHandler = withFaceCheckErrors(async (request: NextRequest) => {
  const candidate = await requireFaceCheckCandidate(request)
  return NextResponse.json(
    await new GetFaceCheckAccessUseCase(new PrismaCandidateVerificationRepository(prisma)).execute(
      candidate,
    ),
  )
})

export const myFaceCheckVerificationsHandler = withFaceCheckErrors(async (request: NextRequest) => {
  const candidate = await requireFaceCheckCandidate(request)
  return NextResponse.json(
    await new ListMyFaceCheckVerificationsUseCase(
      new PrismaCandidateVerificationRepository(prisma),
    ).execute(candidate, (token) => buildCaptureUrl(request, token)),
  )
})

export const myFaceCheckVerificationsCountHandler = withFaceCheckErrors(
  async (request: NextRequest) => {
    const candidate = await requireFaceCheckCandidate(request)
    return NextResponse.json(
      await new GetMyFaceCheckVerificationCountsUseCase(
        new PrismaCandidateVerificationRepository(prisma),
      ).execute(candidate),
    )
  },
)
