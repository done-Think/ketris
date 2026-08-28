import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { getLocale } from 'next-intl/server'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import { authOptions } from '@shared/lib/auth/auth-options'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [locale, session] = await Promise.all([getLocale(), getServerSession(authOptions)])

  if (!session || session.scope !== 'tenant') redirect(getLocalizedPathname('/login', locale))

  return <Box sx={{ minHeight: '100vh' }}>{children}</Box>
}
