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

import { opportunityStageByStatus } from '../../config/opportunity-stages'
import type { StatusChangeDialogProps } from '../../types/opportunity-detail'

export function StatusChangeDialog({
  nextStatus,
  opportunity,
  stage,
  isPending,
  onClose,
  onConfirm,
}: StatusChangeDialogProps) {
  const t = useTranslations('crm.opportunityDetail')
  const pipelineT = useTranslations('crm.pipeline')
  const fromStage = pipelineT(`stages.${stage.labelKey}`)
  const toStage = nextStatus
    ? pipelineT(`stages.${opportunityStageByStatus[nextStatus].labelKey}`)
    : ''

  return (
    <Dialog open={Boolean(nextStatus)} onClose={() => !isPending && onClose()}>
      <DialogTitle sx={{ letterSpacing: 0 }}>{t('confirmStageTitle')}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          {nextStatus
            ? t('confirmStageDescription', {
                name: opportunity.leadName,
                from: fromStage,
                to: toStage,
              })
            : ''}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button disabled={isPending} onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button variant="contained" disabled={isPending} onClick={onConfirm}>
          {isPending ? <CircularProgress size={20} /> : t('actions.confirmStageChange')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
