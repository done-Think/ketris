import type { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { privateMetadata } from '@/i18n/seo'
import { authOptions } from '@shared/lib/auth/auth-options'
import { AuthenticationUnavailable } from '@shared/components/layout/AuthenticationUnavailable'

export const metadata = privateMetadata

export default async function FaceCheckLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (session?.authUnavailable) return <AuthenticationUnavailable />
  if (session?.scope !== 'tenant' || !session.tenantId || !session.user.id) notFound()
  return <ScopedMessages namespaces={['face_check']}>{children}</ScopedMessages>
}
