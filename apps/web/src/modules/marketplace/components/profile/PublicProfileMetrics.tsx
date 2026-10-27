'use client'

import { Box, Typography } from '@mui/material'

import type { PublicProfileMetricsProps } from '../../types/public-profile-metrics'
import {
  styles,
  getMetricIconStyles,
  getTypographyStyles,
} from '../../styles/public-profile-metrics.styles'

export function PublicProfileMetrics({ accentColor, metrics }: PublicProfileMetricsProps) {
  return (
    <Box sx={styles.box}>
      {metrics.map(({ label, value, icon: MetricIcon }) => (
        <Box key={label} sx={styles.box2}>
          {MetricIcon ? <MetricIcon sx={getMetricIconStyles({ accentColor })} /> : null}
          <Typography sx={styles.typography}>{label}</Typography>
          <Typography sx={getTypographyStyles({ accentColor })}>{value}</Typography>
        </Box>
      ))}
    </Box>
  )
}
