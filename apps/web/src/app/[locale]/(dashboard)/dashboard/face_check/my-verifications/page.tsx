import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getPathname } from '@/i18n/navigation'
import { FaceCheckMyVerificationsPage } from '@modules/face_check'
import { authOptions } from '@shared/lib/auth/auth-options'
import { AuthenticationUnavailable } from '@shared/components/layout/AuthenticationUnavailable'
import { resolveFaceCheckCandidate } from '@server/face_check/require-face-check-candidate'
import { AppError } from '@server/shared/errors'
import { prisma } from '@server/db/prisma'
import { PrismaCandidateVerificationRepository } from '@server/face_check/infrastructure/prisma-candidate-verification-repository'
import { ListMyFaceCheckVerificationsUseCase } from '@server/face_check/verification/application/use-cases/candidate-verifications'
import type { FaceCheckCandidate } from '@server/face_check/types/candidate'

export default async function MyVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string | string[] }>
}) {
  const session = await getServerSession(authOptions)
  if (session?.authUnavailable) return <AuthenticationUnavailable />
  if (session?.scope !== 'tenant' || !session.tenantId || !session.user.id) notFound()
  let candidate: FaceCheckCandidate
  try {
    candidate = await resolveFaceCheckCandidate({
      userId: session.user.id,
      tenantId: session.tenantId,
    })
  } catch (error) {
    if (error instanceof AppError && [401, 403, 404].includes(error.status)) notFound()
    throw error
  }
  if ((await searchParams).start === 'next') {
    const locale = await getLocale()
    const { items } = await new ListMyFaceCheckVerificationsUseCase(
      new PrismaCandidateVerificationRepository(prisma),
    ).execute(candidate, (token) =>
      getPathname({
        locale,
        href: { pathname: '/face_check/verify/[token]', params: { token } },
      }),
    )
    const pending = items.find((item) => item.captureUrl)
    if (pending?.captureUrl) redirect(pending.captureUrl)
  }
  return <FaceCheckMyVerificationsPage />
}
