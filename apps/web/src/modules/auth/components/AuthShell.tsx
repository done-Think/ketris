import type { ReactNode } from 'react'
import { Box } from '@mui/material'

import { surface } from '@shared/theme/tokens'

import { AuthBrandPanel } from './AuthBrandPanel'

type AuthShellProps = {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 55.2%) minmax(440px, 44.8%)' },
        gridTemplateRows: { xs: 'auto 1fr', md: '1fr' },
        bgcolor: surface.paper,
      }}
    >
      <AuthBrandPanel />

      <Box
        component="main"
        sx={{
          position: 'relative',
          minHeight: { xs: 'calc(100dvh - 220px)', md: '100dvh' },
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 5, md: 4 },
          pt: { xs: 5, sm: 8, md: 10 },
          pb: { xs: 5, md: 10 },
          bgcolor: surface.paper,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 390 }}>{children}</Box>
      </Box>
    </Box>
  )
}
