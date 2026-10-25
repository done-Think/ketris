import type { ReactNode } from 'react'

import type { LocaleRouteParams } from '@/i18n/types/route.types'
import { PlatformShell } from '@modules/platform'
import { requirePlatformSession } from '@shared/lib/auth/require-platform-session'
import { AuthenticationUnavailableError } from '@shared/lib/auth/authentication-unavailable-error'
import { AuthenticationUnavailable } from '@shared/components/layout/AuthenticationUnavailable'

export default async function PlatformLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<LocaleRouteParams>
}) {
  const { locale } = await params

  try {
    await requirePlatformSession(locale)
  } catch (error) {
    if (error instanceof AuthenticationUnavailableError) return <AuthenticationUnavailable />
    throw error
  }

  return <PlatformShell>{children}</PlatformShell>
}
