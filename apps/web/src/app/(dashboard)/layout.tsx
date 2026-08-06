import type { ReactNode } from 'react'
import { Box } from '@mui/material'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@shared/lib/auth/auth-options'

// Layout das áreas autenticadas (proprietário, corretor, imobiliária).
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')

  return <Box sx={{ minHeight: '100vh' }}>{children}</Box>
}
