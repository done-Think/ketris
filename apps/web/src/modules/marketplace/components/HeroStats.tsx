import { Stack, Typography } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'

import { alpha, componentText } from '@shared/theme/tokens'

const heroStats = [
  { value: 2500, labelKey: 'activeProperties' },
  { value: 180, labelKey: 'partnerBrokers' },
  { value: 45, labelKey: 'servedCities' },
] as const

export function HeroStats() {
  const locale = useLocale()
  const t = useTranslations('marketplace.home.hero.stats')

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
        <Stack key={stat.labelKey} direction="row" alignItems="baseline" spacing={1}>
          <Typography sx={{ color: 'primary.main', ...componentText.heroStatValue }}>
            {new Intl.NumberFormat(locale).format(stat.value)}+
          </Typography>
          <Typography sx={{ color: alpha.white[78], ...componentText.heroStatLabel }}>
            {t(stat.labelKey)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}
