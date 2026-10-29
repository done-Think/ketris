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
import * as crmStyles from '../../styles/archive-opportunity-dialog.styles'

import type { ArchiveOpportunityDialogProps } from '../../types/opportunity-detail'

export function ArchiveOpportunityDialog({
  open,
  isPending,
  onClose,
  onConfirm,
}: ArchiveOpportunityDialogProps) {
  const t = useTranslations('crm.opportunityDetail')

  return (
    <Dialog open={open} onClose={() => !isPending && onClose()}>
      <DialogTitle sx={crmStyles.dialogTitleSx}>{t('archiveTitle')}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{t('archiveDescription')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button disabled={isPending} onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button color="error" variant="contained" disabled={isPending} onClick={onConfirm}>
          {isPending ? <CircularProgress size={20} /> : t('archive')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
