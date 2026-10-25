'use client'

import { styles } from '../styles/cancel-agenda-event-dialog.styles'

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { RhfTextField } from '@shared/components/form'
import { buildCancelAgendaEventSchema } from '../schemas/cancel-agenda-event-schema'
import type { CancelAgendaEventValues } from '../types/agenda-event'
import { useTranslations } from 'next-intl'

import type { CancelAgendaEventDialogProps } from '../types/agenda-event'

export function CancelAgendaEventDialog(props: CancelAgendaEventDialogProps) {
  return props.open ? <CancelAgendaEventDialogContent {...props} /> : null
}

function CancelAgendaEventDialogContent({
  open,
  isPending,
  title,
  onClose,
  onConfirm,
}: CancelAgendaEventDialogProps) {
  const t = useTranslations('agenda.eventDetail.deleteDialog')
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CancelAgendaEventValues>({
    defaultValues: { reason: '' },
    resolver: zodResolver(buildCancelAgendaEventSchema((key) => t(key))),
  })
  const pending = isPending || isSubmitting

  return (
    <Dialog open={open} onClose={() => !pending && onClose()}>
      <form noValidate onSubmit={handleSubmit(onConfirm)}>
        <DialogTitle sx={styles.dialogTitle}>{t('title')}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">{t('description', { title })}</Typography>
          <RhfTextField
            control={control}
            name="reason"
            label={t('reason')}
            multiline
            minRows={3}
            fullWidth
            disabled={pending}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={pending} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button color="error" variant="contained" disabled={pending} type="submit">
            {pending ? <CircularProgress size={20} /> : t('confirm')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
