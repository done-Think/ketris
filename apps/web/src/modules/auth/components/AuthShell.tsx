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
  contentMaxWidth = 560,
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
        display: { xs: 'grid', md: 'block' },
        gridTemplateRows: { xs: layout.pageRows, md: '1fr' },
        bgcolor: layout.pageBackground,
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
          width: { xs: 'auto', md: '50%' },
          ml: { xs: 0, md: '50%' },
          minHeight: { xs: layout.mainMinHeight, md: '100dvh' },
          overflowY: 'auto',
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'center',
          px: { xs: layout.mainPaddingX, sm: layout.mainPaddingXSm, md: 4 },
          pt: { xs: layout.mainPaddingTop, sm: layout.mainPaddingTopSm, md: 0 },
          pb: { xs: layout.mainPaddingBottom, md: 0 },
          bgcolor: { xs: layout.mainBackground, md: 'transparent' },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: contentMaxWidth,
            px: { xs: layout.cardPaddingX, md: 4 },
            pt: { xs: layout.cardPaddingTop, md: 5 },
            pb: { xs: layout.cardPaddingBottom, md: 5 },
            borderRadius: { xs: layout.cardRadius, md: `${radius.lg}px` },
            bgcolor: { xs: layout.cardBackground, md: surface.paper },
            boxShadow: { xs: layout.cardShadow, md: shadows.popover },
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

          {footer && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 3, md: 4 } }}>
              {footer}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
