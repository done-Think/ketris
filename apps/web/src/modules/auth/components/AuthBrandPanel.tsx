import { Box, Stack, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'

import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'
import { componentText, gradients, surface } from '@shared/theme/tokens'

import authCityImage from '../assets/ketris-city-network.jpg'

const AUTH_CITY_IMAGE_URL = authCityImage.src
const DEFAULT_DESCRIPTION = 'A infraestrutura digital do mercado imobiliário'

import type { AuthBrandPanelProps } from '../types/auth-shell'

export function AuthBrandPanel({
  description = DEFAULT_DESCRIPTION,
  mobileBackdrop = false,
}: AuthBrandPanelProps) {
  return (
    <Box
      component="section"
      aria-label="Ketris, infraestrutura digital do mercado imobiliário"
      sx={{
        position: { xs: mobileBackdrop ? 'absolute' : 'relative', md: 'absolute' },
        inset: { xs: mobileBackdrop ? 0 : 'auto', md: 0 },
        width: { xs: mobileBackdrop ? '100%' : 'auto', md: '100%' },
        minHeight: { xs: mobileBackdrop ? '100dvh' : 220, md: '100dvh' },
        overflow: 'hidden',
        display: 'grid',
        placeItems: { xs: 'center', md: 'center start' },
        px: 3,
        color: surface.lightText,
        backgroundColor: surface.darkDeep,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${AUTH_CITY_IMAGE_URL}")`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          transform: 'scale(1.01)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: gradients.authBrandOverlay,
        },
      }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={{ xs: 0.75, md: 0.75 }}
        sx={{
          zIndex: 1,
          display: { xs: mobileBackdrop ? 'none' : 'flex', md: 'flex' },
          position: { xs: 'relative', md: 'absolute' },
          left: { xs: 'auto', md: 0 },
          top: { xs: 'auto', md: '50%' },
          transform: { xs: 'none', md: 'translateY(-50%)' },
          width: { xs: '100%', md: '50%' },
          px: { xs: 3, md: 6 },
          textAlign: 'center',
        }}
      >
        <AppLogo src={ketrisLogoFooter} width={{ xs: 128, md: 136 }} />

        <Typography
          sx={{
            width: '100%',
            maxWidth: { xs: 430, md: 'none' },
            whiteSpace: { xs: 'normal', md: 'nowrap' },
            color: muiAlpha(surface.lightText, 0.68),
            ...componentText.authBrandTagline,
          }}
        >
          {description}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            width: '100%',
            color: muiAlpha(surface.lightText, 0.48),
            letterSpacing: '0.01em',
          }}
        >
          2.500+ imóveis conectados
        </Typography>
      </Stack>
    </Box>
  )
}
