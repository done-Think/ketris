import { Box } from '@mui/material'

import type { DashboardLayoutProps } from '@modules/dashboard'
import { DashboardSidebar } from '@shared/components/layout/DashboardSidebar'
import { surface } from '@shared/theme/tokens'

// Layout das areas autenticadas (proprietario, corretor, imobiliaria).
export default function DashboardLayout({ children }: DashboardLayoutProps) {
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
