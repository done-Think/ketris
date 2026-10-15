'use client'

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Box, Chip, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { useSystemHealth } from '../hooks/use-system-health'
import type { ApiErrorTrackingHealth } from '../types/platform-system'
import { splitUptime } from '../utils/system-health'

// Real health only: the database is measured on each request, the uptime is this server
// instance's, and errors come from Sentry. Availability % and traffic need an external monitor.
export function PlatformSystemPage() {
  const t = useTranslations('platform.system')
  const format = useFormatter()
  const healthQuery = useSystemHealth()
  const health = healthQuery.data

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ pb: 1.75, mb: 2.4, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Typography component="h1" sx={headingSx}>
          {t('title')}
        </Typography>
        {health ? (
          <Typography sx={{ color: brand.neutral[500], fontSize: 12.5 }}>
            {t('checkedAt', {
              time: format.dateTime(new Date(health.checkedAt), { timeStyle: 'medium' }),
            })}
          </Typography>
        ) : null}
      </Stack>

      {healthQuery.isPending ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : healthQuery.isError || !health ? (
        <Box sx={panelSx}>
          <Typography sx={{ color: brand.neutral[500], fontSize: 13.5 }}>
            {t('loadError')}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              gap: 2,
            }}
          >
            <Box component="section" aria-labelledby="system-database-title" sx={panelSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography id="system-database-title" sx={eyebrowSx}>
                  {t('database.label')}
                </Typography>
                <StatusChip
                  ok={health.database.status === 'up'}
                  label={t(`database.${health.database.status}`)}
                />
              </Stack>
              <Typography sx={valueSx}>
                {health.database.latencyMs === null
                  ? '—'
                  : format.number(health.database.latencyMs, {
                      style: 'unit',
                      unit: 'millisecond',
                      unitDisplay: 'narrow',
                    })}
              </Typography>
              <Typography sx={helperSx}>{t('database.helper')}</Typography>
            </Box>

            <Box component="section" aria-labelledby="system-server-title" sx={panelSx}>
              <Typography id="system-server-title" sx={eyebrowSx}>
                {t('server.label')}
              </Typography>
              <Typography sx={valueSx}>
                {(() => {
                  const uptime = splitUptime(health.serverUptimeSeconds)
                  return uptime.days > 0
                    ? t('server.uptimeDays', { days: uptime.days, hours: uptime.hours })
                    : t('server.uptimeHours', { hours: uptime.hours, minutes: uptime.minutes })
                })()}
              </Typography>
              <Typography sx={helperSx}>{t('server.helper')}</Typography>
            </Box>
          </Box>

          <ErrorTrackingPanel errorTracking={health.errorTracking} />

          <Typography sx={{ color: brand.neutral[500], fontSize: 12 }}>
            {t('externalMonitoringNote')}
          </Typography>
        </Stack>
      )}
    </Box>
  )
}

function ErrorTrackingPanel({ errorTracking }: { errorTracking: ApiErrorTrackingHealth }) {
  const t = useTranslations('platform.system.errors')
  const format = useFormatter()

  return (
    <Box
      component="section"
      aria-labelledby="system-errors-title"
      sx={{ ...panelSx, p: 0, overflow: 'hidden' }}
    >
      <Box sx={{ px: 2.25, py: 1.6, borderBottom: '1px solid', borderColor: alpha.graphite[8] }}>
        <Typography id="system-errors-title" sx={cardTitleSx}>
          {t('title')}
        </Typography>
      </Box>
      {!errorTracking.configured ? (
        <Box sx={{ px: 2.25, py: 2.5 }}>
          <Typography sx={{ color: brand.graphite[500], fontSize: 14, fontWeight: 800 }}>
            {t('notConfiguredTitle')}
          </Typography>
          <Typography sx={{ color: brand.neutral[500], fontSize: 13, mt: 0.5 }}>
            {t('notConfiguredDescription')}
          </Typography>
        </Box>
      ) : !errorTracking.available ? (
        <Typography sx={{ color: brand.neutral[500], fontSize: 13, px: 2.25, py: 2.5 }}>
          {t('unavailable')}
        </Typography>
      ) : errorTracking.issues.length === 0 ? (
        <Typography sx={{ color: brand.neutral[500], fontSize: 13, px: 2.25, py: 2.5 }}>
          {t('empty')}
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {errorTracking.issues.map((issue) => (
            <Stack
              component="li"
              key={issue.id}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={{ xs: 0.75, sm: 2 }}
              sx={{
                px: 2.25,
                py: 1.4,
                borderBottom: '1px solid',
                borderColor: alpha.graphite[6],
                '&:last-of-type': { borderBottom: 0 },
              }}
            >
              <Chip
                size="small"
                color={issue.level === 'warning' ? 'warning' : 'error'}
                label={issue.level.toUpperCase()}
                sx={{ fontWeight: 800, fontSize: 11, minWidth: 64 }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={{
                    color: brand.graphite[500],
                    fontSize: 13,
                    fontWeight: 700,
                    wordBreak: 'break-word',
                  }}
                >
                  {issue.title}
                </Typography>
                <Typography sx={{ color: brand.neutral[500], fontSize: 12 }}>
                  {t('issueMeta', {
                    count: issue.eventsCount,
                    lastSeen: format.dateTime(new Date(issue.lastSeen), {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }),
                  })}
                </Typography>
              </Box>
              <Link
                href={issue.permalink}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: 12.5,
                  flexShrink: 0,
                }}
              >
                {t('openInSentry')}
                <OpenInNewRoundedIcon aria-hidden sx={{ fontSize: iconSize.xs }} />
              </Link>
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  )
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Chip
      size="small"
      label={label}
      color={ok ? 'success' : 'error'}
      sx={{ fontWeight: 800, fontSize: 11, height: 22 }}
    />
  )
}

const panelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  p: { xs: 1.6, md: 2.2 },
  minWidth: 0,
}
const headingSx = {
  color: brand.graphite[500],
  fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
  fontSize: { xs: 26, sm: 30 },
  fontWeight: 700,
  lineHeight: 1.15,
}
const eyebrowSx = { color: brand.neutral[500], fontSize: 12, fontWeight: 800 }
const cardTitleSx = { color: brand.graphite[500], fontSize: 16, fontWeight: 900, lineHeight: 1.25 }
const valueSx = {
  color: brand.graphite[500],
  fontSize: 29,
  fontWeight: 900,
  lineHeight: 1.1,
  mt: 1.1,
}
const helperSx = { color: brand.neutral[500], fontSize: 12, mt: 1 }
