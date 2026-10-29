'use client'

import { Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { useMarketplaceStats } from '../hooks/use-marketplace-stats'
import { styles } from '../styles/hero-stats.styles'
import type { MarketplaceStats } from '../types/public-property'

const statLabels = {
  publishedProperties: 'activeProperties',
  publishedBrokers: 'partnerBrokers',
  servedCities: 'servedCities',
} as const
const statKeys = [
  'publishedProperties',
  'publishedBrokers',
  'servedCities',
] as const satisfies readonly (keyof MarketplaceStats)[]

export function HeroStats() {
  const format = useFormatter()
  const t = useTranslations('marketplace.home.hero.stats')
  const { data: stats } = useMarketplaceStats()

  if (!stats) return null

  const items = statKeys.filter((key) => stats[key] > 0)
  if (!items.length) return null

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ xs: 1.5, sm: 3, xl: 5 }}
      justifyContent={{ sm: 'center', lg: 'flex-start' }}
      alignItems={{ sm: 'center', lg: 'baseline' }}
      sx={styles.list}
    >
      {items.map((key) => (
        <Stack key={key} direction="row" alignItems="baseline" spacing={1}>
          <Typography sx={styles.value}>{format.number(stats[key])}</Typography>
          <Typography sx={styles.label}>{t(statLabels[key], { count: stats[key] })}</Typography>
        </Stack>
      ))}
    </Stack>
  )
}
