import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import { Button, Paper, Stack } from '@mui/material'
import { canTransition } from '@server/crm/domain/opportunity-status'
import { useTranslations } from 'next-intl'
import { opportunityStages } from '../../config/opportunity-stages'
import * as crmStyles from '../../styles/opportunity-actions-footer.styles'

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
    <Paper component="footer" elevation={0} sx={crmStyles.paperSx}>
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
            disabled={
              isMutating ||
              !opportunityStages.some(
                ({ status }) =>
                  status !== opportunity.status && canTransition(opportunity.status, status),
              )
            }
            onClick={onStageMenuOpen}
          >
            {t('moveStage')}
          </Button>
          {opportunity.status !== 'REJECTED' && (
            <Button
              color="error"
              variant="outlined"
              disabled={isMutating || !canTransition(opportunity.status, 'REJECTED')}
              onClick={onDiscardLead}
            >
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
