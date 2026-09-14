import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import { Button, Paper, Stack } from '@mui/material'

import { radius, shadows } from '@shared/theme/tokens'

import type { OpportunityActionsFooterProps } from '../../types/opportunity-detail'

export function OpportunityActionsFooter({
  opportunity,
  isMutating,
  onStageMenuOpen,
  onDiscardLead,
  onEdit,
  onArchive,
}: OpportunityActionsFooterProps) {
  return (
    <Paper
      component="footer"
      elevation={0}
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 5,
        mx: { xs: 1, sm: 2.5, lg: 3.5 },
        mt: 1,
        p: { xs: 1.4, sm: 1.7 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: `${radius.md}px`,
        boxShadow: shadows.popover,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        gap={1}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <Button
            variant="contained"
            startIcon={<SellOutlinedIcon />}
            endIcon={<ExpandMoreRoundedIcon />}
            disabled={isMutating}
            onClick={onStageMenuOpen}
          >
            Mover de etapa
          </Button>
          {opportunity.status !== 'RECUSADA' && (
            <Button color="error" variant="outlined" disabled={isMutating} onClick={onDiscardLead}>
              Descartar lead
            </Button>
          )}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <Button startIcon={<EditOutlinedIcon />} disabled={isMutating} onClick={onEdit}>
            Editar dados
          </Button>
          <Button
            color="inherit"
            startIcon={<ArchiveOutlinedIcon />}
            disabled={isMutating || Boolean(opportunity.arquivadaEm)}
            onClick={onArchive}
          >
            {opportunity.arquivadaEm ? 'Arquivada' : 'Arquivar'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
