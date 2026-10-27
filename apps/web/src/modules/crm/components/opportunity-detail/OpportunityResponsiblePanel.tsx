import { MenuItem, Paper, TextField, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { extractErrorMessage } from '@shared/utils/error-message'

import { useAssignOpportunityResponsible, useCrmResponsibles } from '../../hooks/use-opportunities'
import * as crmStyles from '../../styles/opportunity-responsible-panel.styles'
import type { OpportunityResponsiblePanelProps } from '../../types/opportunity-detail'

export function OpportunityResponsiblePanel({
  opportunity,
  tenantId,
  canManage,
}: OpportunityResponsiblePanelProps) {
  const t = useTranslations('crm.opportunityDetail.responsible')
  const { enqueueSnackbar } = useSnackbar()
  const responsibles = useCrmResponsibles(canManage)
  const assign = useAssignOpportunityResponsible(tenantId)
  const options = responsibles.data ?? []
  const hasCurrent = options.some((option) => option.id === opportunity.responsibleId)

  const change = async (responsibleId: string) => {
    if (responsibleId === opportunity.responsibleId) return
    try {
      const updated = await assign.mutateAsync({ id: opportunity.id, responsibleId })
      enqueueSnackbar(t('changed', { name: updated.responsibleName }), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(
        extractErrorMessage(error, t('changeError'), {
          INVALID_OPPORTUNITY_RESPONSIBLE: t('invalid'),
        }),
        { variant: 'error' },
      )
    }
  }

  return (
    <Paper component="section" elevation={0} sx={crmStyles.paperSx}>
      <Typography component="h2" sx={crmStyles.titleSx}>
        {t('title')}
      </Typography>
      {canManage && options.length ? (
        <TextField
          select
          fullWidth
          size="small"
          label={t('label')}
          value={opportunity.responsibleId}
          disabled={assign.isPending}
          onChange={(event) => void change(event.target.value)}
        >
          {hasCurrent ? null : (
            <MenuItem value={opportunity.responsibleId}>{opportunity.responsibleName}</MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      ) : (
        <Typography sx={crmStyles.nameSx}>{opportunity.responsibleName}</Typography>
      )}
    </Paper>
  )
}
