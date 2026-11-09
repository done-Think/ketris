import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { FaceCheckCandidateCapturePage, FaceCheckMyVerificationsPage } from '@modules/face_check'
import { privateMetadata } from '@/i18n/seo'
import { authOptions } from '@shared/lib/auth/auth-options'
import { AuthenticationUnavailable } from '@shared/components/layout/AuthenticationUnavailable'
import { resolveFaceCheckCandidate } from '@server/face_check/require-face-check-candidate'
import { PrismaCandidateVerificationRepository } from '@server/face_check/infrastructure/prisma-candidate-verification-repository'
import { prisma } from '@server/db/prisma'
import { AppError } from '@server/shared/errors'

export const metadata: Metadata = { ...privateMetadata, referrer: 'no-referrer' }

export default async function MyVerificationCapturePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.authUnavailable) return <AuthenticationUnavailable />
  if (session?.scope !== 'tenant' || !session.tenantId || !session.user.id) notFound()
  let verification
  try {
    const candidate = await resolveFaceCheckCandidate({
      userId: session.user.id,
      tenantId: session.tenantId,
    })
    verification = await new PrismaCandidateVerificationRepository(prisma).capture(
      candidate,
      (await params).id,
    )
  } catch (error) {
    if (error instanceof AppError && [401, 403, 404].includes(error.status)) notFound()
    throw error
  }
  if (!verification) notFound()
  if (!verification.captureToken) return <FaceCheckMyVerificationsPage />
  return (
    <FaceCheckCandidateCapturePage
      token={verification.captureToken}
      userId={session.user.id}
      tenantId={session.tenantId}
    />
  )
}
