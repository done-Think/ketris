import { Box, Stack, Typography } from '@mui/material'

import { getMetricIconStyles, styles } from '../styles/metric.styles'
import type { MetricProps } from '../types/charge'

export function Metric({ label, value, icon, tone }: MetricProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={styles.card}>
      <Box sx={getMetricIconStyles(tone)}>{icon}</Box>
      <Box sx={styles.text}>
        <Typography sx={styles.label}>{label}</Typography>
        <Typography sx={styles.value}>{value}</Typography>
      </Box>
    </Stack>
  )
}
