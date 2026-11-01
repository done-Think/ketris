'use client'

import { Alert, AlertTitle, Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { SessionCardProps } from '../../../types/console.types'
import { detailStyles as styles } from '../../../styles/console.styles'

export function SessionAlerts({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.alerts')

  if (session.alerts.length === 0) return null

  return (
    <Alert severity="warning" variant="outlined">
      <AlertTitle>{t('title')}</AlertTitle>
      <Box component="ul" sx={styles.alertList}>
        {session.alerts.map((alert) => (
          <li key={alert}>{t(alert)}</li>
        ))}
      </Box>
    </Alert>
  )
}
