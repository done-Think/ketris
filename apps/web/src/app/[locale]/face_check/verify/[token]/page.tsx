import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { FaceCheckCapturePage } from '@modules/face_check'
import { ScopedMessages } from '@/i18n/scoped-messages'
import { privateMetadata } from '@/i18n/seo'
import { getPathname } from '@/i18n/navigation'
import { authOptions } from '@shared/lib/auth/auth-options'
import { AuthenticationUnavailable } from '@shared/components/layout/AuthenticationUnavailable'
import { resolveFaceCheckCandidate } from '@server/face_check/require-face-check-candidate'
import { PrismaCandidateVerificationRepository } from '@server/face_check/infrastructure/prisma-candidate-verification-repository'
import { prisma } from '@server/db/prisma'
import { AppError } from '@server/shared/errors'

export const metadata: Metadata = { ...privateMetadata, referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

export default async function FaceCheckCaptureRoute({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await getServerSession(authOptions)
  if (session?.authUnavailable) return <AuthenticationUnavailable />
  let ownId: string | undefined
  if (session?.scope === 'tenant' && session.tenantId && session.user.id) {
    try {
      const candidate = await resolveFaceCheckCandidate({
        userId: session.user.id,
        tenantId: session.tenantId,
      })
      ownId = (
        await new PrismaCandidateVerificationRepository(prisma).findByToken(candidate, token)
      )?.id
    } catch (error) {
      if (!(error instanceof AppError && [401, 403, 404].includes(error.status))) throw error
    }
  }
  if (ownId)
    redirect(
      getPathname({
        locale: await getLocale(),
        href: { pathname: '/dashboard/face_check/my-verifications/[id]', params: { id: ownId } },
      }),
    )
  return (
    <ScopedMessages namespaces={['face_check']}>
      <FaceCheckCapturePage token={token} />
    </ScopedMessages>
  )
}
