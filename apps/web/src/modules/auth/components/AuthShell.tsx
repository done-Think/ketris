import type { ReactNode } from 'react'
import { Box } from '@mui/material'

import { AppLogo } from '@shared/components/ui'
import { radius, surface } from '@shared/theme/tokens'

import { AuthBrandPanel } from './AuthBrandPanel'

type AuthShellProps = {
  brandDescription?: string
  children: ReactNode
  contentMaxWidth?: number
  contentPaddingTop?: number
  footer?: ReactNode
  mobileCard?: boolean
}

export function AuthShell({
  brandDescription,
  children,
  contentMaxWidth = 390,
  contentPaddingTop = 11.5,
  footer,
  mobileCard = false,
}: AuthShellProps) {
  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100dvh',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 55.2%) minmax(440px, 44.8%)' },
        gridTemplateRows: { xs: mobileCard ? '1fr' : 'auto 1fr', md: '1fr' },
        bgcolor: { xs: mobileCard ? surface.darkDeep : surface.paper, md: surface.paper },
      }}
    >
      <AuthBrandPanel description={brandDescription} mobileBackdrop={mobileCard} />

      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: { xs: mobileCard ? 1 : 'auto', md: 'auto' },
          minHeight: {
            xs: mobileCard ? '100dvh' : 'calc(100dvh - 220px)',
            md: '100dvh',
          },
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          px: { xs: mobileCard ? 2.25 : 2.5, sm: mobileCard ? 3 : 5, md: 4 },
          pt: { xs: mobileCard ? 4.875 : 5, sm: mobileCard ? 5 : 8, md: contentPaddingTop },
          pb: { xs: mobileCard ? 12 : 5, md: 10 },
          bgcolor: { xs: mobileCard ? 'transparent' : surface.paper, md: surface.paper },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: contentMaxWidth,
            px: { xs: mobileCard ? 3.125 : 0, md: 0 },
            pt: { xs: mobileCard ? 3.25 : 0, md: 0 },
            pb: { xs: mobileCard ? 3 : 0, md: 0 },
            borderRadius: { xs: mobileCard ? `${radius.md}px` : 0, md: 0 },
            bgcolor: { xs: mobileCard ? surface.paper : 'transparent', md: 'transparent' },
            boxShadow: {
              xs: mobileCard ? '0 18px 48px rgba(13, 15, 20, 0.2)' : 'none',
              md: 'none',
            },
          }}
        >
          {mobileCard && (
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                justifyContent: 'center',
                mb: 0.75,
              }}
            >
              <AppLogo src="/ketris-logo-transparent.png" width={88} />
            </Box>
          )}

          {children}
        </Box>

        {footer && (
          <Box
            component="footer"
            sx={{
              position: 'absolute',
              right: 0,
              bottom: { xs: mobileCard ? 5.25 : 3.5, md: 3.5 },
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
