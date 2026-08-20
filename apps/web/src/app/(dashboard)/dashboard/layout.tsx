import type { ReactNode } from 'react'
import { Box } from '@mui/material'

import { DashboardSidebar } from '@shared/components/layout/DashboardSidebar'
import { surface } from '@shared/theme/tokens'

export default function DashboardSectionLayout({ children }: { children: ReactNode }) {
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
