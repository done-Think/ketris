'use client'

import { Box } from '@mui/material'
import { usePathname } from 'next/navigation'

import { DashboardSidebar } from '@shared/components/layout/DashboardSidebar'
import { surface } from '@shared/theme/tokens'

import type { DashboardLayoutProps } from '../types/dashboard-layout'
import { OwnerDashboardHeader } from './OwnerDashboardHeader'

export function DashboardRouteShell({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  if (pathname === '/dashboard') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: surface.app }}>
        <OwnerDashboardHeader />
        <Box component="main" sx={{ minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surface.app }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
          minHeight: '100vh',
        }}
      >
        <DashboardSidebar />

        <Box component="main" sx={{ minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
