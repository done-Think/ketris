'use client'

import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardPanel } from '@shared/components/ui/DashboardPanel'

import type { AgencyOverviewKpiGridProps } from '../types/agency-overview'
import { getHelperStyles, styles } from '../styles/agency-overview-kpi-grid.styles'

export function AgencyOverviewKpiGrid({ kpis }: AgencyOverviewKpiGridProps) {
  const t = useTranslations('dashboard.agencyOverview.kpis')

  return (
    <Box sx={styles.box}>
      {kpis.map((kpi) => (
        <DashboardPanel key={kpi.id}>
          <Box sx={styles.box2}>
            <Stack spacing={{ xs: 0.75, md: 0.7 }} sx={styles.stack}>
              <Typography noWrap sx={styles.typography}>
                {t(kpi.labelKey)}
              </Typography>
              <Typography noWrap sx={styles.typography2}>
                {kpi.value}
              </Typography>
              {kpi.helper ? (
                <Typography noWrap sx={getHelperStyles(kpi.tone)}>
                  {t(`helpers.${kpi.helper.key}`, kpi.helper.values)}
                </Typography>
              ) : null}
            </Stack>
            {typeof kpi.progress === 'number' ? (
              <Box sx={styles.box3}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={46}
                  thickness={5}
                  sx={styles.circularProgress}
                />
                <CircularProgress
                  variant="determinate"
                  value={kpi.progress}
                  size={46}
                  thickness={5}
                  sx={styles.circularProgress2}
                />
                <Typography sx={styles.typography3}>{kpi.progress}%</Typography>
              </Box>
            ) : null}
          </Box>
        </DashboardPanel>
      ))}
    </Box>
  )
}
