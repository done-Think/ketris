'use client'

import { Box, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import type { PlatformMetric } from '../types/platform-overview'
import { styles } from '../styles/platform-metric-cards.styles'

export function PlatformMetricCards({ metrics }: { metrics: readonly PlatformMetric[] }) {
  const t = useTranslations('platform.overview.metrics')
  const format = useFormatter()

  return (
    <Box sx={styles.box}>
      {metrics.map((metric) => (
        <Box key={metric.id} sx={styles.box2}>
          <Typography sx={styles.typography}>{t(`${metric.id}.label`)}</Typography>
          <Box sx={styles.box3}>
            <Typography sx={styles.typography2}>
              {formatMetricValue(metric, format.number)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function formatMetricValue(
  metric: PlatformMetric,
  number: ReturnType<typeof useFormatter>['number'],
) {
  if (metric.value === null) return '—'

  switch (metric.format) {
    case 'compactNumber':
      return number(metric.value, { notation: 'compact', maximumFractionDigits: 1 })
    case 'compactCurrency':
      return number(metric.value, {
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
        style: 'currency',
        currency: 'BRL',
      })
    case 'percent':
      return number(metric.value, { style: 'percent', maximumFractionDigits: 2 })
    default:
      return number(metric.value)
  }
}
