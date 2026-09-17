import type { ReactNode } from 'react'

import type { LocaleRouteParams } from '@/i18n/types/route.types'
import { requirePlatformSession } from '@shared/lib/auth/require-platform-session'

export default async function PlatformLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<LocaleRouteParams>
}) {
  const { locale } = await params

  await requirePlatformSession(locale)

  return children
}
