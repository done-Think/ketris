import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Box, Stack, Typography } from '@mui/material'

import ketrisLogoTransparent from '@shared/assets/ketris-logo-transparent.png'
import { AppLogo } from '@shared/components/ui'
import { brand, gradients, iconSize, radius, surface } from '@shared/theme/tokens'

import { REGISTRATION_BENEFITS } from '../config/registration-benefits'

export function RegistrationBenefitsPanel() {
  return (
    <Box
      component="aside"
      sx={{
        minHeight: { xs: 'auto', md: '100dvh' },
        px: { xs: 2.5, sm: 4, md: 6.5 },
        py: { xs: 2.5, md: 6.5 },
        display: 'flex',
        flexDirection: 'column',
        bgcolor: surface.app,
      }}
    >
      <AppLogo src={ketrisLogoTransparent} variant="transparent" width={{ xs: 92, md: 112 }} />

      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 280,
            height: 180,
            borderRadius: `${radius.xl}px`,
            background: gradients.registrationHighlight,
          }}
        />

        <Stack spacing={2.5} sx={{ mt: 5 }}>
          {REGISTRATION_BENEFITS.map((benefit) => (
            <Stack key={benefit} direction="row" alignItems="center" spacing={1.5}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: `${radius.full}px`,
                  bgcolor: brand.magenta[50],
                }}
              >
                <CheckRoundedIcon sx={{ color: brand.magenta[500], fontSize: iconSize.sm }} />
              </Box>
              <Typography sx={{ fontSize: 15 }}>{benefit}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Typography
        color="text.secondary"
        variant="caption"
        sx={{ display: { xs: 'none', md: 'block' } }}
      >
        © 2026 Ketris. Todos os direitos reservados.
      </Typography>
    </Box>
  )
}
