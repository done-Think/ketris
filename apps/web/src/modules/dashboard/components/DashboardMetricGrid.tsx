import { Box, Stack, Typography } from '@mui/material'
import NorthIcon from '@mui/icons-material/North'

import { DashboardPanel } from '@shared/components/ui/DashboardPanel'

import type { DashboardMetricGridProps } from '../types/dashboard-overview'
import { getCaptionStyles, styles } from '../styles/dashboard-metric-grid.styles'

export function DashboardMetricGrid({ metrics }: DashboardMetricGridProps) {
  return (
    <Box sx={styles.box}>
      {metrics.map((metric) => (
        <DashboardPanel key={metric.label}>
          <Box sx={styles.box2}>
            <Typography sx={styles.typography}>{metric.label}</Typography>
            <Typography sx={styles.typography2}>{metric.value}</Typography>
            {metric.caption ? (
              <Stack direction="row" alignItems="center" spacing={0.25} sx={styles.stack}>
                {metric.tone === 'success' ? <NorthIcon sx={styles.northIcon} /> : null}
                <Typography sx={getCaptionStyles(metric.tone)}>{metric.caption}</Typography>
              </Stack>
            ) : null}
          </Box>
        </DashboardPanel>
      ))}
    </Box>
  )
}
