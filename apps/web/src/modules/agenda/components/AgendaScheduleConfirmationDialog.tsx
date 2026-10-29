'use client'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import type { AgendaScheduleConfirmationDialogProps } from '../types/agenda-schedule'

export function AgendaScheduleConfirmationDialog({
  open,
  isPending,
  onBack,
  onConfirm,
}: AgendaScheduleConfirmationDialogProps) {
  const t = useTranslations('agenda.eventForm.outsideHoursWarning')
  return (
    <Dialog
      open={open}
      onClose={() => !isPending && onBack()}
      aria-describedby="agenda-outside-hours-description"
      aria-labelledby="agenda-outside-hours-title"
    >
      <DialogTitle id="agenda-outside-hours-title">{t('title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id="agenda-outside-hours-description">{t('message')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus disabled={isPending} onClick={onBack}>
          {t('back')}
        </Button>
        <Button variant="contained" disabled={isPending} onClick={onConfirm}>
          {t('continue')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
