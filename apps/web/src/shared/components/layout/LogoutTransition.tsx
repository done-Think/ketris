'use client'

import { Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { styles } from '@shared/styles/logout-transition.styles'
import type { LogoutTransitionProps } from '@shared/types/app-shell'

export function LogoutTransition({ hasError, onRetry }: LogoutTransitionProps) {
  const t = useTranslations('common.appShell')
  return (
    <Stack role={hasError ? 'alert' : 'status'} sx={styles.screen}>
      {hasError ? (
        <>
          <Typography>{t('signOutError')}</Typography>
          <Button variant="contained" onClick={onRetry}>
            {t('retrySignOut')}
          </Button>
        </>
      ) : (
        <>
          <CircularProgress size={32} aria-hidden="true" />
          <Typography>{t('signingOut')}</Typography>
        </>
      )}
    </Stack>
  )
}
