import { Box, Stack, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'

import { AppLogo } from '@shared/components/ui'
import { brand, surface } from '@shared/theme/tokens'

const AUTH_CITY_IMAGE_URL = '/auth/ketris-city-network.png'

export function AuthBrandPanel() {
  return (
    <Box
      component="section"
      aria-label="Ketris, infraestrutura digital do mercado imobiliário"
      sx={{
        position: 'relative',
        minHeight: { xs: 220, md: '100dvh' },
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
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
          backgroundImage: `linear-gradient(180deg, ${muiAlpha(
            surface.darkDeep,
            0.08,
          )} 0%, ${muiAlpha(surface.darkDeep, 0.64)} 100%), radial-gradient(circle at 62% 12%, ${muiAlpha(
            brand.magenta[500],
            0.4,
          )} 0%, transparent 42%)`,
        },
      }}
    >
      <Stack
        alignItems="center"
        spacing={{ xs: 1, md: 1.25 }}
        sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
      >
        <AppLogo src="/ketris-logo-footer.png" width={{ xs: 132, md: 142 }} />

        <Typography
          sx={{
            maxWidth: 430,
            color: muiAlpha(surface.lightText, 0.72),
            fontSize: { xs: 14, md: 18 },
          }}
        >
          A infraestrutura digital do mercado imobiliário
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: muiAlpha(surface.lightText, 0.56), letterSpacing: '0.01em' }}
        >
          2.500+ imóveis conectados
        </Typography>
      </Stack>
    </Box>
  )
}
