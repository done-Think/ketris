import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import type { LocaleRouteParams } from '@/i18n/types/route.types'
import { authOptions } from '@shared/lib/auth/auth-options'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<LocaleRouteParams>
}) {
  const { locale } = await params
  const session = await getServerSession(authOptions)

  if (!session || session.scope !== 'tenant') redirect(getLocalizedPathname('/login', locale))

  return <Box sx={{ minHeight: '100vh' }}>{children}</Box>
}
