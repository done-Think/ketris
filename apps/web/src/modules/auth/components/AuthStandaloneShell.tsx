import type { ReactNode } from 'react'
import { Box } from '@mui/material'

import { surface } from '@shared/theme/tokens'

type AuthStandaloneShellProps = {
  children: ReactNode
  footer: ReactNode
}

export function AuthStandaloneShell({ children, footer }: AuthStandaloneShellProps) {
  return (
    <Box
      component="main"
      sx={{
        width: '100%',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 2.5, sm: 3 },
        pt: 7.5,
        pb: 3.5,
        bgcolor: surface.paper,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 354 }}>{children}</Box>

      <Box component="footer" sx={{ mt: 'auto', pt: 6 }}>
        {footer}
      </Box>
    </Box>
  )
}
