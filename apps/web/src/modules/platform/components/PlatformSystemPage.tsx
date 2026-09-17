'use client'

import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
import { Box, Button, Chip, Stack, Switch, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import {
  clusterLogs,
  errorNotifications,
  networkTraffic,
  platformHealthMetrics,
} from '../data/platform-system-fixtures'
import type { ClusterLogLevel } from '../types/platform-system'

const logTone: Record<ClusterLogLevel, { bgcolor: string; color: string }> = {
  INFO: { bgcolor: brand.neutral[100], color: brand.neutral[500] },
  WARN: { bgcolor: '#FFF0E6', color: '#D97706' },
  ERROR: { bgcolor: '#FDEBEC', color: brand.semantic.error },
}

export function PlatformSystemPage() {
  const t = useTranslations('platform.system')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [logs, setLogs] = useState(clusterLogs)

  return (
    <Box sx={{ maxWidth: 1680, mx: 'auto', px: 4, py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography component="h1" sx={headingSx}>
          {t('title')}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>
            {t('autoRefresh')}
          </Typography>
          <Switch
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
            inputProps={{ 'aria-label': t('autoRefresh') }}
            size="small"
          />
        </Stack>
      </Stack>

      <Box
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 2, mb: 3 }}
      >
        {platformHealthMetrics.map((metric) => (
          <Box key={metric.id} sx={panelSx}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={eyebrowSx}>{t(`metrics.${metric.id}.label`)}</Typography>
              <Box
                aria-label={t(`metrics.${metric.id}.status`)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: radius.full,
                  bgcolor: metric.tone === 'success' ? brand.semantic.success : '#F59E0B',
                }}
              />
            </Stack>
            <Typography
              sx={{
                color: brand.graphite[500],
                fontSize: 29,
                fontWeight: 900,
                lineHeight: 1.1,
                mt: 1.1,
              }}
            >
              {metric.value}
            </Typography>
            <Chip
              label={t(`metrics.${metric.id}.status`)}
              size="small"
              sx={{
                ...statusChipSx,
                mt: 1.25,
                ...(metric.tone === 'warning'
                  ? logTone.WARN
                  : { bgcolor: '#E7F7EE', color: brand.semantic.success }),
              }}
            />
          </Box>
        ))}
      </Box>

      <Box
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 2, mb: 3 }}
      >
        <Box component="section" aria-labelledby="network-title" sx={panelSx}>
          <Stack direction="row" justifyContent="space-between" alignItems="start">
            <Box>
              <Typography sx={{ ...eyebrowSx, color: brand.magenta[500] }}>
                {t('networkEyebrow')}
              </Typography>
              <Typography id="network-title" sx={cardTitleSx}>
                {t('networkTitle')}
              </Typography>
            </Box>
            <Typography sx={helperSx}>{t('networkAverage')}</Typography>
          </Stack>
          <LineChart
            dataset={[...networkTraffic]}
            xAxis={[{ dataKey: 'time', scaleType: 'point' }]}
            series={[
              { dataKey: 'requests', color: brand.magenta[500], area: true, showMark: false },
            ]}
            height={190}
            margin={{ top: 18, right: 10, bottom: 26, left: 8 }}
            grid={{ horizontal: true }}
            sx={chartSx}
          />
        </Box>
        <Box component="section" aria-labelledby="errors-title" sx={panelSx}>
          <Stack direction="row" justifyContent="space-between" alignItems="start">
            <Box>
              <Typography sx={{ ...eyebrowSx, color: brand.semantic.error }}>
                {t('errorsEyebrow')}
              </Typography>
              <Typography id="errors-title" sx={cardTitleSx}>
                {t('errorsTitle')}
              </Typography>
            </Box>
            <Typography sx={helperSx}>{t('errorsTotal')}</Typography>
          </Stack>
          <BarChart
            dataset={[...errorNotifications]}
            xAxis={[{ dataKey: 'time', scaleType: 'band' }]}
            series={[{ dataKey: 'count', color: '#F44343' }]}
            height={190}
            margin={{ top: 18, right: 10, bottom: 26, left: 8 }}
            sx={chartSx}
          />
        </Box>
      </Box>

      <Box
        component="section"
        aria-labelledby="cluster-logs-title"
        sx={{ ...panelSx, p: 0, overflow: 'hidden' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.25, py: 1.6, borderBottom: '1px solid', borderColor: alpha.graphite[8] }}
        >
          <Typography id="cluster-logs-title" sx={cardTitleSx}>
            {t('logsTitle')}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setLogs([])}
            sx={{
              color: brand.graphite[500],
              borderColor: alpha.graphite[12],
              fontSize: 12,
              textTransform: 'none',
            }}
          >
            {t('clearConsole')}
          </Button>
        </Stack>
        {logs.length === 0 ? (
          <Typography sx={{ color: brand.neutral[500], fontSize: 13, py: 4, textAlign: 'center' }}>
            {t('emptyConsole')}
          </Typography>
        ) : (
          logs.map((log) => (
            <Stack
              key={`${log.time}-${log.message}`}
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{
                minHeight: 43,
                px: 2.25,
                borderBottom: '1px solid',
                borderColor: alpha.graphite[6],
              }}
            >
              <Typography sx={{ ...monoSx, width: 70 }}>{log.time}</Typography>
              <Chip
                label={log.level}
                size="small"
                sx={{ ...statusChipSx, ...logTone[log.level], width: 46 }}
              />
              <Box sx={{ ...serviceSx }}>{log.service}</Box>
              <Typography sx={{ color: brand.graphite[500], fontSize: 12.5, minWidth: 0 }}>
                {log.message}
              </Typography>
            </Stack>
          ))
        )}
      </Box>
    </Box>
  )
}

const panelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.md}px`,
  boxShadow: shadows.crmCardCompact,
  p: 2.25,
  minWidth: 0,
}
const headingSx = {
  color: brand.graphite[500],
  fontSize: 34,
  fontWeight: 900,
  letterSpacing: -0.55,
  lineHeight: 1.1,
}
const eyebrowSx = { color: brand.neutral[500], fontSize: 12, fontWeight: 800 }
const cardTitleSx = {
  color: brand.graphite[500],
  fontSize: 16,
  fontWeight: 900,
  lineHeight: 1.25,
  mt: 0.35,
}
const helperSx = { color: brand.neutral[500], fontSize: 11.5, mt: 1.1 }
const statusChipSx = {
  borderRadius: `${radius.sm}px`,
  fontSize: 10.5,
  fontWeight: 800,
  height: 20,
  '& .MuiChip-label': { px: 0.9 },
}
const chartSx = {
  '& .MuiChartsAxis-left': { display: 'none' },
  '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': { fill: brand.neutral[500], fontSize: 10 },
  '& .MuiChartsGrid-line': { stroke: alpha.graphite[8] },
}
const monoSx = { color: brand.neutral[500], fontFamily: 'monospace', fontSize: 11 }
const serviceSx = {
  bgcolor: brand.neutral[100],
  borderRadius: `${radius.sm}px`,
  color: brand.graphite[500],
  fontFamily: 'monospace',
  fontSize: 10.5,
  fontWeight: 700,
  px: 1,
  py: 0.3,
  width: 112,
}
