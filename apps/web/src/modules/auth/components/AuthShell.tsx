import { Box } from '@mui/material'

import ketrisLogoTransparent from '@shared/assets/ketris-logo-transparent.png'
import { AppLogo } from '@shared/components/ui'
import { radius, shadows, surface } from '@shared/theme/tokens'

import { AuthBrandPanel } from './AuthBrandPanel'
import type { AuthMobileLayout, AuthMobileVariant, AuthShellProps } from '../types/auth-shell'

const mobileLayouts: Record<AuthMobileVariant, AuthMobileLayout> = {
  plain: {
    pageBackground: surface.paper,
    pageRows: 'auto 1fr',
    mainZIndex: 'auto',
    mainMinHeight: 'calc(100dvh - 220px)',
    mainPaddingX: 2.5,
    mainPaddingXSm: 5,
    mainPaddingTop: 5,
    mainPaddingTopSm: 8,
    mainPaddingBottom: 5,
    mainBackground: surface.paper,
    cardPaddingX: 0,
    cardPaddingTop: 0,
    cardPaddingBottom: 0,
    cardRadius: 0,
    cardBackground: 'transparent',
    cardShadow: 'none',
    footerBottom: 3.5,
  },
  card: {
    pageBackground: surface.darkDeep,
    pageRows: '1fr',
    mainZIndex: 1,
    mainMinHeight: '100dvh',
    mainPaddingX: 2.25,
    mainPaddingXSm: 3,
    mainPaddingTop: 4.875,
    mainPaddingTopSm: 4.875,
    mainPaddingBottom: 12,
    mainBackground: 'transparent',
    cardPaddingX: 3.125,
    cardPaddingTop: 3.25,
    cardPaddingBottom: 3,
    cardRadius: `${radius.md}px`,
    cardBackground: surface.paper,
    cardShadow: shadows.popover,
    footerBottom: 5.25,
  },
  backdrop: {
    pageBackground: surface.darkDeep,
    pageRows: '1fr',
    mainZIndex: 1,
    mainMinHeight: '100dvh',
    mainPaddingX: 2,
    mainPaddingXSm: 3,
    mainPaddingTop: 9.875,
    mainPaddingTopSm: 9.875,
    mainPaddingBottom: 6,
    mainBackground: 'transparent',
    cardPaddingX: 2.5,
    cardPaddingTop: 2.5,
    cardPaddingBottom: 2.5,
    cardRadius: `${radius.md}px`,
    cardBackground: surface.paper,
    cardShadow: shadows.popover,
    footerBottom: 1.25,
  },
}

export function AuthShell({
  brandDescription,
  children,
  contentMaxWidth = 390,
  contentPaddingTop = 11.5,
  footer,
  mobileVariant = 'plain',
}: AuthShellProps) {
  const layout = mobileLayouts[mobileVariant]

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100dvh',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 55.2%) minmax(440px, 44.8%)' },
        gridTemplateRows: { xs: layout.pageRows, md: '1fr' },
        bgcolor: { xs: layout.pageBackground, md: surface.paper },
      }}
    >
      <AuthBrandPanel description={brandDescription} mobileBackdrop={mobileVariant !== 'plain'} />

      {mobileVariant === 'backdrop' && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 2,
            top: 1.25,
            left: 0.5,
            display: { xs: 'flex', md: 'none' },
          }}
        >
          <AppLogo src={ketrisLogoTransparent} variant="transparent" width={76} />
        </Box>
      )}

      <Box
        component="main"
        sx={{
          position: 'relative',
          zIndex: { xs: layout.mainZIndex, md: 'auto' },
          minHeight: { xs: layout.mainMinHeight, md: '100dvh' },
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          px: { xs: layout.mainPaddingX, sm: layout.mainPaddingXSm, md: 4 },
          pt: { xs: layout.mainPaddingTop, sm: layout.mainPaddingTopSm, md: contentPaddingTop },
          pb: { xs: layout.mainPaddingBottom, md: 10 },
          bgcolor: { xs: layout.mainBackground, md: surface.paper },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: contentMaxWidth,
            px: { xs: layout.cardPaddingX, md: 0 },
            pt: { xs: layout.cardPaddingTop, md: 0 },
            pb: { xs: layout.cardPaddingBottom, md: 0 },
            borderRadius: { xs: layout.cardRadius, md: 0 },
            bgcolor: { xs: layout.cardBackground, md: 'transparent' },
            boxShadow: { xs: layout.cardShadow, md: 'none' },
          }}
        >
          {mobileVariant === 'card' && (
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                justifyContent: 'center',
                mb: 0.75,
              }}
            >
              <AppLogo src={ketrisLogoTransparent} variant="transparent" width={88} />
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
              bottom: { xs: layout.footerBottom, md: 3.5 },
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
