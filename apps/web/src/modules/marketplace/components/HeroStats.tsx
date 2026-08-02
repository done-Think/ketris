import { Stack, Typography } from '@mui/material'

import { alpha } from '@shared/theme/tokens'

const heroStats = [
  { value: '2.500+', label: 'imóveis ativos' },
  { value: '180+', label: 'corretores parceiros' },
  { value: '45+', label: 'cidades atendidas' },
] as const

export function HeroStats() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ xs: 1.5, sm: 3, xl: 5 }}
      justifyContent={{ sm: 'center', lg: 'flex-start' }}
      alignItems={{ sm: 'center', lg: 'baseline' }}
      sx={{
        mt: { sm: 3.2, xl: 5 },
        display: { xs: 'none', sm: 'flex' },
        width: '100%',
        maxWidth: { sm: 620, xl: 760 },
        transform: { sm: 'translateY(20px)', lg: 'none' },
      }}
    >
      {heroStats.map((stat) => (
        <Stack key={stat.label} direction="row" alignItems="baseline" spacing={1}>
          <Typography sx={{ color: 'primary.main', fontSize: { sm: 20, xl: 28 }, fontWeight: 900 }}>
            {stat.value}
          </Typography>
          <Typography sx={{ color: alpha.white[78], fontSize: { sm: 11, xl: 13 } }}>
            {stat.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}
