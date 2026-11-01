'use client'

import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { ErrorNotice } from '../../ui'

import { useReopenSession } from '../../../hooks/use-console-mutations'
import type { SessionCardProps } from '../../../types/console.types'
import { cardStyles, detailStyles as styles } from '../../../styles/console.styles'

export function ReopenAttempt({ session }: SessionCardProps) {
  const t = useTranslations('face_check.console.detail.decision.reopen')
  const reopen = useReopenSession(session.id)
  const [confirming, setConfirming] = useState(false)
  const attemptsLeft = Math.max(0, session.maxAttempts - session.attemptsUsed)

  return (
    <Box sx={styles.form}>
      <Typography sx={cardStyles.caption}>
        {attemptsLeft > 0 ? t('help', { attemptsLeft }) : t('noAttempts')}
      </Typography>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<ReplayRoundedIcon />}
        disabled={attemptsLeft <= 0 || reopen.isPending}
        onClick={() => setConfirming(true)}
      >
        {t('button')}
      </Button>
      {reopen.error ? <ErrorNotice error={reopen.error} /> : null}

      <Dialog open={confirming} onClose={() => setConfirming(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('confirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('confirm', { name: session.personName })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="secondary" onClick={() => setConfirming(false)}>
            {t('back')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={reopen.isPending}
            onClick={() => reopen.mutate(undefined, { onSettled: () => setConfirming(false) })}
          >
            {t('button')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
