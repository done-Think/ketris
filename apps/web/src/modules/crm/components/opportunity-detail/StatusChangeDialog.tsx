import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

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
  return (
    <Dialog open={Boolean(nextStatus)} onClose={() => !isPending && onClose()}>
      <DialogTitle sx={{ letterSpacing: 0 }}>Confirmar mudança de etapa</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          {nextStatus
            ? `Mover ${opportunity.interessadoNome} de ${stage.label} para ${opportunityStageByStatus[nextStatus].label}?`
            : ''}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button disabled={isPending} onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="contained" disabled={isPending} onClick={onConfirm}>
          {isPending ? <CircularProgress size={20} /> : 'Confirmar mudança'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
