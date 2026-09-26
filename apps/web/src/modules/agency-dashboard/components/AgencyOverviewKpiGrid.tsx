'use client'

import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardPanel } from '@modules/dashboard/components/DashboardPanel'
import { brand } from '@shared/theme/tokens'

import { agencyOverviewKpis } from '../data/agency-overview'

const helperColor = {
  neutral: brand.neutral[500],
  success: brand.semantic.success,
  warning: brand.semantic.warning,
}

export function AgencyOverviewKpiGrid() {
  const t = useTranslations('dashboard.agencyOverview.kpis')

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(5, minmax(0, 1fr))',
        },
        gap: { xs: 1.2, md: 1.6 },
      }}
    >
      {agencyOverviewKpis.map((kpi) => (
        <DashboardPanel key={kpi.id}>
          <Box
            sx={{
              display: 'flex',
              minHeight: { xs: 118, md: 122 },
              minWidth: 0,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              overflow: 'hidden',
              p: { xs: 1.45, md: 2.2 },
            }}
          >
            <Stack spacing={{ xs: 0.75, md: 0.7 }} sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  color: brand.neutral[500],
                  fontSize: { xs: 10.5, md: 11 },
                  fontWeight: 900,
                  textTransform: 'uppercase',
                }}
              >
                {t(kpi.labelKey)}
              </Typography>
              <Typography
                noWrap
                sx={{
                  color: brand.graphite[500],
                  fontSize: { xs: 22, sm: 28 },
                  fontWeight: 900,
                  lineHeight: 1.12,
                }}
              >
                {kpi.value}
              </Typography>
              <Typography
                noWrap
                sx={{
                  color: helperColor[kpi.tone],
                  fontSize: { xs: 10.5, md: 11 },
                  fontWeight: 900,
                  lineHeight: 1.25,
                }}
              >
                {kpi.helper}
              </Typography>
            </Stack>
            {typeof kpi.progress === 'number' ? (
              <Box sx={{ position: 'relative', flexShrink: 0, width: 46, height: 46 }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={46}
                  thickness={5}
                  sx={{ color: brand.magenta[50], position: 'absolute' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={kpi.progress}
                  size={46}
                  thickness={5}
                  sx={{ color: brand.magenta[500], position: 'absolute' }}
                />
                <Typography
                  sx={{
                    display: 'grid',
                    width: 46,
                    height: 46,
                    placeItems: 'center',
                    color: brand.magenta[600],
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  {kpi.progress}%
                </Typography>
              </Box>
            ) : null}
          </Box>
        </DashboardPanel>
      ))}
    </Box>
  )
}
