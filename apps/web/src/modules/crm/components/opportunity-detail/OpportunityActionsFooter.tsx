import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import { Button, Paper, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('crm.opportunityDetail')
  return (
    <Paper
      component="footer"
      elevation={0}
      sx={{
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
            {t('moveStage')}
          </Button>
          {opportunity.status !== 'RECUSADA' && (
            <Button color="error" variant="outlined" disabled={isMutating} onClick={onDiscardLead}>
              {t('discardLead')}
            </Button>
          )}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
          <Button startIcon={<EditOutlinedIcon />} disabled={isMutating} onClick={onEdit}>
            {t('editData')}
          </Button>
          <Button
            color="inherit"
            startIcon={<ArchiveOutlinedIcon />}
            disabled={isMutating || Boolean(opportunity.archivedAt)}
            onClick={onArchive}
          >
            {opportunity.archivedAt ? t('archived') : t('archive')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
