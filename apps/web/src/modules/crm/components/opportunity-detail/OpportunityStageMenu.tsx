import { Box, Menu, MenuItem } from '@mui/material'
import { canTransition } from '@server/crm/domain/opportunity-status'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/opportunity-stage-menu.styles'

import { opportunityStages } from '../../config/opportunity-stages'
import type { OpportunityStageMenuProps } from '../../types/opportunity-detail'

export function OpportunityStageMenu({
  anchorEl,
  opportunity,
  onClose,
  onRequestStatusChange,
}: OpportunityStageMenuProps) {
  const t = useTranslations('crm.pipeline')

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      {opportunityStages
        .filter(
          ({ status }) =>
            status !== opportunity.status && canTransition(opportunity.status, status),
        )
        .map((option) => (
          <MenuItem key={option.status} onClick={() => onRequestStatusChange(option.status)}>
            <Box sx={crmStyles.stageMarkerSx(option.color)} />
            {t(`stages.${option.labelKey}`)}
          </MenuItem>
        ))}
    </Menu>
  )
}
