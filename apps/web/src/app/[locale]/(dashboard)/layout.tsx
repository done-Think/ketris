import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { getPathname } from '@/i18n/navigation'
import { ScopedMessages } from '@/i18n/scoped-messages'
import { dashboardMessageNamespaces } from '@/i18n/message-selection'
import { privateMetadata } from '@/i18n/seo'

import { resolveLocale } from '@/i18n/routing'
import type { LocaleRouteParams } from '@/i18n/types/route.types'
import { authOptions } from '@shared/lib/auth/auth-options'
import { AuthenticationUnavailable } from '@shared/components/layout/AuthenticationUnavailable'

export const metadata = privateMetadata

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<LocaleRouteParams>
}) {
  const { locale } = await params
  const session = await getServerSession(authOptions)
  if (session?.authUnavailable) return <AuthenticationUnavailable />

  if (!session || session.scope !== 'tenant') {
    redirect(getPathname({ href: '/login', locale: resolveLocale(locale) }))
  }

  return (
    <ScopedMessages namespaces={dashboardMessageNamespaces}>
      <Box sx={{ minHeight: '100vh' }}>{children}</Box>
    </ScopedMessages>
  )
}
