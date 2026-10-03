import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'

import { radius } from '@shared/theme/tokens'

export function ArchiveChargeDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const t = useTranslations('charges.archiveDialog')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { borderRadius: `${radius.sm}px` } } }}
    >
      <DialogTitle>{t('title')}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{t('description')}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 2.8 }, pb: 2.5, pt: 0 }}>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
