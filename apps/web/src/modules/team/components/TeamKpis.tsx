'use client'

import { Box, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../styles/team-kpis.styles'
import type { TeamKpisProps } from '../types/broker-team'

export function TeamKpis({ summary, pendingInvitations }: TeamKpisProps) {
  const t = useTranslations('dashboard.team.kpis')
  const kpis = [
    {
      id: 'activeBrokers',
      value: summary.activeBrokers,
      helper: t('activeBrokersHelper', { count: pendingInvitations }),
    },
    { id: 'properties', value: summary.properties, helper: t('propertiesHelper') },
    { id: 'monthlySales', value: summary.monthlySales, helper: t('monthlySalesHelper') },
    {
      id: 'averageGoal',
      value: summary.averageGoalProgress === null ? t('empty') : `${summary.averageGoalProgress}%`,
      helper: t('averageGoalHelper'),
    },
  ] as const

  return (
    <Box sx={styles.grid}>
      {kpis.map((kpi) => (
        <Paper key={kpi.id} variant="outlined" sx={styles.card}>
          <Stack spacing={0.4}>
            <Typography sx={styles.label}>{t(kpi.id)}</Typography>
            <Typography sx={styles.value}>{kpi.value}</Typography>
            <Typography sx={styles.helper}>{kpi.helper}</Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
