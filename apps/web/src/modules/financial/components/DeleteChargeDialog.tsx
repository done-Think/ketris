import { Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../styles/financial-dialog.styles'
import type { DeleteChargeDialogProps } from '../types/charge'
import { FinancialDialogTitle } from './FinancialDialogTitle'

export function DeleteChargeDialog({ open, pending, onClose, onConfirm }: DeleteChargeDialogProps) {
  const t = useTranslations('charges.deleteDialog')

  return (
    <Dialog open={open} onClose={onClose} slotProps={{ paper: { sx: styles.paper } }}>
      <FinancialDialogTitle title={t('title')} closeLabel={t('cancel')} onClose={onClose} />
      <DialogContent sx={styles.content}>
        <Typography sx={styles.hint}>{t('description')}</Typography>
      </DialogContent>
      <DialogActions sx={styles.actions}>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={pending}>
          {t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
