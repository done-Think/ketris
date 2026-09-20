import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { getServerSession } from 'next-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import type { LocaleRouteParams } from '@/i18n/types/route.types'
import { authOptions } from '@shared/lib/auth/auth-options'
import { AppShell } from '@shared/components/layout/AppShell'

function isLocalMaintenancePreview(host: string | null) {
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
  const allowLocalMaintenancePreview = isLocalMaintenancePreview(requestHeaders.get('host'))

  if (!allowLocalMaintenancePreview) {
    const session = await getServerSession(authOptions)

    if (!session || session.scope !== 'tenant') {
      redirect(getLocalizedPathname('/login', locale))
    }
  }

  return (
    <AppShell allowLocalMaintenancePreview={allowLocalMaintenancePreview}>
      <Box sx={{ minHeight: '100vh' }}>{children}</Box>
    </AppShell>
  )
}
