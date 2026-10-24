import { Alert, Button, CircularProgress, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { PropertyQueryFeedbackProps } from '../types/dashboard-property'
import { styles } from '../styles/property-query-feedback.styles'

export function PropertyQueryFeedback({ loading = false, onRetry }: PropertyQueryFeedbackProps) {
  const t = useTranslations('properties.detail')
  return (
    <Stack alignItems="center" justifyContent="center" sx={styles.container}>
      {loading ? (
        <CircularProgress aria-label={t('loading')} size={30} />
      ) : (
        <Alert
          severity="error"
          action={
            onRetry ? (
              <Button color="inherit" onClick={onRetry}>
                {t('retry')}
              </Button>
            ) : undefined
          }
        >
          {t('loadError')}
        </Alert>
      )}
    </Stack>
  )
}
