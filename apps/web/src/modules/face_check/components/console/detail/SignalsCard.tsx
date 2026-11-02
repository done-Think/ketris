'use client'

import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import { Box, Chip, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import type { SessionSignal } from '../../../types'

import type { SessionCardProps, SignalRowProps } from '../../../types/console.types'
import { cardStyles, detailStyles as styles } from '../../../styles/console.styles'
import { SessionAlerts } from './SessionAlerts'

function useSignalFormatter() {
  const format = useFormatter()
  const t = useTranslations('face_check.console.detail.signals')

  return (signal: SessionSignal, value: number) =>
    signal.unit === 'px'
      ? t('pixels', { value })
      : signal.key === 'faceMatch'
        ? format.number(value * 100, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) + '%'
        : format.number(value, { maximumFractionDigits: 3 })
}

function SignalRow({ signal }: SignalRowProps) {
  const t = useTranslations('face_check.console.detail.signals')
  const formatValue = useSignalFormatter()
  const label = t(`items.${signal.key}.label`)
  const percent = Math.max(0, Math.min(100, (signal.value / signal.max) * 100))
  const value = formatValue(signal, signal.value)

  if (signal.threshold === null) {
    return (
      <Box sx={styles.signalRow}>
        <Box>
          <Typography sx={styles.signalLabel}>{label}</Typography>
          <Typography sx={styles.signalHelp}>{t(`items.${signal.key}.help`)}</Typography>
        </Box>
        <Box sx={styles.signalTrack} role="img" aria-label={t('ariaNoThreshold', { label, value })}>
          <Box sx={styles.signalFillNeutral(percent)} />
        </Box>
        <Box sx={styles.signalValue}>
          <Typography component="span" sx={styles.mono}>
            {value}
          </Typography>
          <Typography component="span" sx={cardStyles.caption}>
            {t(signal.key === 'faceMatch' ? 'policyCaption' : 'noThreshold')}
          </Typography>
        </Box>
      </Box>
    )
  }

  const passed = signal.value >= signal.threshold
  const thresholdPercent = Math.min(100, (signal.threshold / signal.max) * 100)
  const threshold = formatValue(signal, signal.threshold)

  return (
    <Box sx={styles.signalRow}>
      <Box>
        <Typography sx={styles.signalLabel}>{label}</Typography>
        <Typography sx={styles.signalHelp}>{t(`items.${signal.key}.help`)}</Typography>
      </Box>
      <Box
        sx={styles.signalTrack}
        role="img"
        aria-label={t('aria', {
          label,
          value,
          threshold,
          verdict: passed ? t('passed') : t('below'),
        })}
      >
        <Box sx={styles.signalFill(percent, passed)} />
        <Box sx={styles.signalThreshold(thresholdPercent)} />
      </Box>
      <Box sx={styles.signalValue}>
        <Typography component="span" sx={styles.mono}>
          {value}
        </Typography>
        <Typography component="span" sx={cardStyles.caption}>
          {t('threshold', { threshold })}
        </Typography>
        <Chip
          size="small"
          icon={passed ? <CheckRoundedIcon /> : <PriorityHighRoundedIcon />}
          label={passed ? t('passed') : t('below')}
          sx={styles.verdict(passed)}
        />
      </Box>
    </Box>
  )
}

export function SignalsCard({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.signals')
  const tReasons = useTranslations('face_check.console.reviewReasons')
  const tStatus = useTranslations('face_check.common.status')
  const format = useFormatter()

  return (
    <Box component="section" aria-labelledby="signals-title" sx={cardStyles.card}>
      <Box>
        <Typography id="signals-title" component="h2" sx={cardStyles.title}>
          {t('title')}
        </Typography>
        <Typography sx={cardStyles.caption}>
          {session.reviewReason
            ? t('subtitleWithReason', { reason: tReasons(session.reviewReason) })
            : t('subtitle')}
        </Typography>
      </Box>
      <SessionAlerts session={session} />
      {session.captureMode === 'camera' ? (
        <Typography sx={cardStyles.caption}>{t('policy')}</Typography>
      ) : null}
      {session.signals.length === 0 ? (
        <Typography sx={cardStyles.empty}>{t('empty')}</Typography>
      ) : (
        <Box>
          {session.signals.map((signal) => (
            <SignalRow key={signal.key} signal={signal} />
          ))}
        </Box>
      )}
      {session.similarityAttempts?.length ? (
        <Box sx={styles.comparisonHistory}>
          <Typography component="h3" sx={styles.signalLabel}>
            {t('historyTitle')}
          </Typography>
          {session.similarityAttempts.map((item) => (
            <Typography key={item.attempt} sx={cardStyles.caption}>
              {t('attemptResult', {
                attempt: item.attempt,
                score:
                  item.similarity === null
                    ? t('unavailable')
                    : format.number(item.similarity * 100, { maximumFractionDigits: 6 }) + '%',
                status: tStatus(item.status),
                at: format.dateTime(new Date(item.analyzedAt), {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }),
              })}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}
