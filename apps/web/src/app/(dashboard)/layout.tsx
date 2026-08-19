import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@shared/lib/auth/auth-options'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || session.scope !== 'tenant') redirect('/login')

  return <Box sx={{ minHeight: '100vh' }}>{children}</Box>
}
