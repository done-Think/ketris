import type { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'

import { privateMetadata } from '@/i18n/seo'
import { authOptions } from '@shared/lib/auth/auth-options'
import { AuthenticationUnavailable } from '@shared/components/layout/AuthenticationUnavailable'
import { resolveFaceCheckActor } from '@server/face_check/require-face-check-actor'
import { AppError } from '@server/shared/errors'

export const metadata = privateMetadata

export default async function FaceCheckManagementLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (session?.authUnavailable) return <AuthenticationUnavailable />
  if (session?.scope !== 'tenant' || !session.tenantId || !session.user.id) notFound()
  try {
    await resolveFaceCheckActor({ userId: session.user.id, tenantId: session.tenantId })
  } catch (error) {
    if (error instanceof AppError && [401, 403, 404].includes(error.status)) notFound()
    throw error
  }
  return children
}
