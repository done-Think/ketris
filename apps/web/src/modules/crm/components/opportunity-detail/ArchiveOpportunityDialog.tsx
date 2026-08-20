import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material'

import type { ArchiveOpportunityDialogProps } from '../../types/opportunity-detail'

export function ArchiveOpportunityDialog({
  open,
  isPending,
  onClose,
  onConfirm,
}: ArchiveOpportunityDialogProps) {
  return (
    <Dialog open={open} onClose={() => !isPending && onClose()}>
      <DialogTitle sx={{ letterSpacing: 0 }}>Arquivar oportunidade?</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          A oportunidade deixará de aparecer no pipeline ativo, mas continuará armazenada no CRM.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button disabled={isPending} onClick={onClose}>
          Cancelar
        </Button>
        <Button color="error" variant="contained" disabled={isPending} onClick={onConfirm}>
          {isPending ? <CircularProgress size={20} /> : 'Arquivar oportunidade'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
