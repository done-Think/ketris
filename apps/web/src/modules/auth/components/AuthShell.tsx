import type { ReactNode } from 'react'
import { Box } from '@mui/material'

import { AppLogo } from '@shared/components/ui'
import { radius, surface } from '@shared/theme/tokens'

import { AuthBrandPanel } from './AuthBrandPanel'

const mobileCardLayouts = {
  backdrop: {
    cardPaddingBottom: 2.5,
    cardPaddingTop: 2.5,
    cardPaddingX: 2.5,
    footerBottom: 1.25,
    mainPaddingBottom: 6,
    mainPaddingTop: 9.875,
    mainPaddingX: 2,
  },
  card: {
    cardPaddingBottom: 3,
    cardPaddingTop: 3.25,
    cardPaddingX: 3.125,
    footerBottom: 5.25,
    mainPaddingBottom: 12,
    mainPaddingTop: 4.875,
    mainPaddingX: 2.25,
  },
} as const

type AuthShellProps = {
  brandDescription?: string
  children: ReactNode
  contentMaxWidth?: number
  contentPaddingTop?: number
  footer?: ReactNode
  mobileCard?: boolean
  mobileLogoPlacement?: 'backdrop' | 'card'
}

export function AuthShell({
  brandDescription,
  children,
  contentMaxWidth = 390,
  contentPaddingTop = 11.5,
  footer,
  mobileCard = false,
  mobileLogoPlacement = 'card',
}: AuthShellProps) {
  const hasBackdropLogo = mobileCard && mobileLogoPlacement === 'backdrop'
  const mobileLayout = mobileCardLayouts[mobileLogoPlacement]

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

      {hasBackdropLogo && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 2,
            top: 1.25,
            left: 0.5,
            display: { xs: 'flex', md: 'none' },
          }}
        >
          <AppLogo src="/ketris-logo-transparent.png" width={76} />
        </Box>
      )}

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
          px: {
            xs: mobileCard ? mobileLayout.mainPaddingX : 2.5,
            sm: mobileCard ? 3 : 5,
            md: 4,
          },
          pt: {
            xs: mobileCard ? mobileLayout.mainPaddingTop : 5,
            sm: mobileCard ? mobileLayout.mainPaddingTop : 8,
            md: contentPaddingTop,
          },
          pb: { xs: mobileCard ? mobileLayout.mainPaddingBottom : 5, md: 10 },
          bgcolor: { xs: mobileCard ? 'transparent' : surface.paper, md: surface.paper },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: contentMaxWidth,
            px: { xs: mobileCard ? mobileLayout.cardPaddingX : 0, md: 0 },
            pt: { xs: mobileCard ? mobileLayout.cardPaddingTop : 0, md: 0 },
            pb: { xs: mobileCard ? mobileLayout.cardPaddingBottom : 0, md: 0 },
            borderRadius: { xs: mobileCard ? `${radius.md}px` : 0, md: 0 },
            bgcolor: { xs: mobileCard ? surface.paper : 'transparent', md: 'transparent' },
            boxShadow: {
              xs: mobileCard ? '0 18px 48px rgba(13, 15, 20, 0.2)' : 'none',
              md: 'none',
            },
          }}
        >
          {mobileCard && mobileLogoPlacement === 'card' && (
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
              bottom: {
                xs: mobileCard ? mobileLayout.footerBottom : 3.5,
                md: 3.5,
              },
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
