import type { ReactNode } from 'react'
import { Box } from '@mui/material'

// Layout das áreas autenticadas (proprietário, corretor, imobiliária).
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Box sx={{ minHeight: '100vh' }}>{children}</Box>
}
