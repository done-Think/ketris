import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getPathname } from '@/i18n/navigation'
import { ScopedMessages } from '@/i18n/scoped-messages'
import { dashboardMessageNamespaces } from '@/i18n/message-selection'
import { privateMetadata } from '@/i18n/seo'

import { resolveLocale } from '@/i18n/routing'
import type { LocaleRouteParams } from '@/i18n/types/route.types'
import { authOptions } from '@shared/lib/auth/auth-options'
import { AppShell } from '@shared/components/layout/AppShell'
import { AuthenticationUnavailable } from '@shared/components/layout/AuthenticationUnavailable'

export const metadata = privateMetadata

function isLocalDashboardPreview(host: string | null) {
  return process.env.NODE_ENV === 'development' && /^localhost(?::\d+)?$/.test(host ?? '')
}

export default async function MaintenancePreviewLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<LocaleRouteParams>
}) {
  const [{ locale }, requestHeaders] = await Promise.all([params, headers()])
  const allowLocalDashboardPreview = isLocalDashboardPreview(requestHeaders.get('host'))

  if (!allowLocalDashboardPreview) {
    const session = await getServerSession(authOptions)
    if (session?.authUnavailable) return <AuthenticationUnavailable />

    if (!session || session.scope !== 'tenant') {
      redirect(getPathname({ href: '/login', locale: resolveLocale(locale) }))
    }
  }

  return (
    <ScopedMessages namespaces={[...dashboardMessageNamespaces, 'dashboard.maintenance']}>
      <AppShell allowLocalDashboardPreview={allowLocalDashboardPreview}>
        <Box sx={{ minHeight: '100vh' }}>{children}</Box>
      </AppShell>
    </ScopedMessages>
  )
}
