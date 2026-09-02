import type { ReactNode } from 'react'

import type { LocaleRouteParams } from '@/i18n/types/route.types'
import { requireAdminSession } from '@shared/lib/auth/require-admin-session'

export default async function BackofficeLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<LocaleRouteParams>
}) {
  const { locale } = await params

  await requireAdminSession(locale)

  return children
}
