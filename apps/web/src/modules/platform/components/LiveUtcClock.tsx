'use client'

import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import { Stack, Typography } from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { liveClockIntervalMs } from '../config/platform-lists'
import { useClock } from '../hooks/use-clock'
import { styles } from '../styles/platform-overview.styles'

export function LiveUtcClock() {
  const t = useTranslations('platform.overview')
  const format = useFormatter()
  const now = useClock(liveClockIntervalMs)

  if (now === null) return null

  return (
    <Stack direction="row" alignItems="center" spacing={0.7} sx={styles.stack2}>
      <AccessTimeOutlinedIcon sx={styles.accessTimeOutlinedIcon} />
      <Typography sx={styles.typography2}>
        {t('liveUtc', {
          value: format.dateTime(new Date(now), {
            dateStyle: 'short',
            timeStyle: 'short',
            timeZone: 'UTC',
          }),
        })}
      </Typography>
    </Stack>
  )
}
