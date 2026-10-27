'use client'

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Box, Chip, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { useSystemHealth } from '../hooks/use-platform-overview'
import type { ApiErrorTrackingHealth } from '../types/platform-system'
import { splitUptime } from '../utils/system-health'
import { styles } from '../styles/platform-system-page.styles'

export function PlatformSystemPage() {
  const t = useTranslations('platform.system')
  const format = useFormatter()
  const healthQuery = useSystemHealth()
  const health = healthQuery.data

  return (
    <Box sx={styles.box}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={styles.stack}
      >
        <Typography component="h1" sx={styles.heading}>
          {t('title')}
        </Typography>
        {health ? (
          <Typography sx={styles.typography}>
            {t('checkedAt', {
              time: format.dateTime(new Date(health.checkedAt), { timeStyle: 'medium' }),
            })}
          </Typography>
        ) : null}
      </Stack>

      {healthQuery.isPending ? (
        <Stack alignItems="center" sx={styles.stack2}>
          <CircularProgress size={28} />
        </Stack>
      ) : healthQuery.isError || !health ? (
        <Box sx={styles.panel}>
          <Typography sx={styles.typography2}>{t('loadError')}</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          <Box sx={styles.box2}>
            <Box component="section" aria-labelledby="system-database-title" sx={styles.panel}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography id="system-database-title" sx={styles.eyebrow}>
                  {t('database.label')}
                </Typography>
                <StatusChip
                  ok={health.database.status === 'up'}
                  label={t(`database.${health.database.status}`)}
                />
              </Stack>
              <Typography sx={styles.value}>
                {health.database.latencyMs === null
                  ? '—'
                  : format.number(health.database.latencyMs, {
                      style: 'unit',
                      unit: 'millisecond',
                      unitDisplay: 'narrow',
                    })}
              </Typography>
              <Typography sx={styles.helper}>{t('database.helper')}</Typography>
            </Box>

            <Box component="section" aria-labelledby="system-server-title" sx={styles.panel}>
              <Typography id="system-server-title" sx={styles.eyebrow}>
                {t('server.label')}
              </Typography>
              <Typography sx={styles.value}>
                {(() => {
                  const uptime = splitUptime(health.serverUptimeSeconds)
                  return uptime.days > 0
                    ? t('server.uptimeDays', { days: uptime.days, hours: uptime.hours })
                    : t('server.uptimeHours', { hours: uptime.hours, minutes: uptime.minutes })
                })()}
              </Typography>
              <Typography sx={styles.helper}>{t('server.helper')}</Typography>
            </Box>
          </Box>

          <ErrorTrackingPanel errorTracking={health.errorTracking} />

          <Typography sx={styles.typography3}>{t('externalMonitoringNote')}</Typography>
        </Stack>
      )}
    </Box>
  )
}

function ErrorTrackingPanel({ errorTracking }: { errorTracking: ApiErrorTrackingHealth }) {
  const t = useTranslations('platform.system.errors')
  const format = useFormatter()

  return (
    <Box component="section" aria-labelledby="system-errors-title" sx={styles.box3}>
      <Box sx={styles.box4}>
        <Typography id="system-errors-title" sx={styles.cardTitle}>
          {t('title')}
        </Typography>
      </Box>
      {!errorTracking.configured ? (
        <Box sx={styles.box5}>
          <Typography sx={styles.typography4}>{t('notConfiguredTitle')}</Typography>
          <Typography sx={styles.typography5}>{t('notConfiguredDescription')}</Typography>
        </Box>
      ) : !errorTracking.available ? (
        <Typography sx={styles.typography6}>{t('unavailable')}</Typography>
      ) : errorTracking.issues.length === 0 ? (
        <Typography sx={styles.typography6}>{t('empty')}</Typography>
      ) : (
        <Box component="ul" sx={styles.box6}>
          {errorTracking.issues.map((issue) => (
            <Stack
              component="li"
              key={issue.id}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={{ xs: 0.75, sm: 2 }}
              sx={styles.stack3}
            >
              <Chip
                size="small"
                color={issue.level === 'warning' ? 'warning' : 'error'}
                label={issue.level.toUpperCase()}
                sx={styles.chip}
              />
              <Box sx={styles.box7}>
                <Typography sx={styles.typography7}>{issue.title}</Typography>
                <Typography sx={styles.typography3}>
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
                sx={styles.link}
              >
                {t('openInSentry')}
                <OpenInNewRoundedIcon aria-hidden sx={styles.openInNewRoundedIcon} />
              </Link>
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  )
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return <Chip size="small" label={label} color={ok ? 'success' : 'error'} sx={styles.chip2} />
}
