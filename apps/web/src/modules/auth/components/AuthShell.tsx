import type { ReactNode } from 'react'
import { Box } from '@mui/material'

import { surface } from '@shared/theme/tokens'

import { AuthBrandPanel } from './AuthBrandPanel'

type AuthShellProps = {
  brandDescription?: string
  children: ReactNode
  contentMaxWidth?: number
  contentPaddingTop?: number
  footer?: ReactNode
}

export function AuthShell({
  brandDescription,
  children,
  contentMaxWidth = 390,
  contentPaddingTop = 11.5,
  footer,
}: AuthShellProps) {
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
      <AuthBrandPanel description={brandDescription} />

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
          pt: { xs: 5, sm: 8, md: contentPaddingTop },
          pb: { xs: 5, md: 10 },
          bgcolor: surface.paper,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: contentMaxWidth }}>{children}</Box>

        {footer && (
          <Box
            component="footer"
            sx={{
              position: 'absolute',
              right: 0,
              bottom: 28,
              left: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {footer}
          </Box>
        )}
      </Box>
    </Box>
  )
}
