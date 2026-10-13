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

import type { ArchiveContactDialogProps } from '../../types/contact'

export function ArchiveContactDialog({
  open,
  isPending,
  onClose,
  onConfirm,
}: ArchiveContactDialogProps) {
  const t = useTranslations('crm.contacts.archiveDialog')

  return (
    <Dialog open={open} onClose={() => !isPending && onClose()}>
      <DialogTitle sx={{ letterSpacing: 0 }}>{t('title')}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{t('description')}</Typography>
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
