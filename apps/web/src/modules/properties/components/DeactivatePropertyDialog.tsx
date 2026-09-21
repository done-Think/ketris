'use client'

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

export interface DeactivatePropertyDialogProps {
  open: boolean
  isPending: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
}

export function DeactivatePropertyDialog({
  open,
  isPending,
  title,
  onClose,
  onConfirm,
}: DeactivatePropertyDialogProps) {
  const t = useTranslations('properties.detail.deleteDialog')

  return (
    <Dialog open={open} onClose={() => !isPending && onClose()}>
      <DialogTitle sx={{ letterSpacing: 0 }}>{t('title')}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{t('description', { title })}</Typography>
      </DialogContent>
      <DialogActions>
        <Button disabled={isPending} onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button color="error" variant="contained" disabled={isPending} onClick={onConfirm}>
          {isPending ? <CircularProgress size={20} /> : t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
