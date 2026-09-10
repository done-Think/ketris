'use client'

import { Box } from '@mui/material'
import { usePathname } from 'next/navigation'

import { DashboardSidebar } from '@shared/components/layout/DashboardSidebar'
import { surface } from '@shared/theme/tokens'

import type { DashboardLayoutProps } from '../types/dashboard-layout'
import { OwnerDashboardHeader } from './OwnerDashboardHeader'
import { OwnerBottomNavigation } from './OwnerBottomNavigation'

export function DashboardRouteShell({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const usesOwnerHeader = pathname === '/dashboard' || pathname === '/dashboard/imoveis'

  if (usesOwnerHeader) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: surface.app }}>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <OwnerDashboardHeader />
        </Box>
        <Box
          component="main"
          sx={{
            minWidth: 0,
            pb: { xs: 'calc(80px + env(safe-area-inset-bottom, 0px))', md: 0 },
          }}
        >
          {children}
        </Box>
        <OwnerBottomNavigation />
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
        <Box sx={{ display: { xs: 'none', md: 'contents' } }}>
          <DashboardSidebar />
        </Box>

        <Box
          component="main"
          sx={{ minWidth: 0, pb: { xs: 'calc(80px + env(safe-area-inset-bottom, 0px))', md: 0 } }}
        >
          {children}
        </Box>
      </Box>
      <OwnerBottomNavigation />
    </Box>
  )
}
