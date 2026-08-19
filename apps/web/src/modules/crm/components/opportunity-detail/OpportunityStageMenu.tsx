import { Box, Menu, MenuItem } from '@mui/material'

import { radius } from '@shared/theme/tokens'

import { opportunityStages } from '../../config/opportunity-stages'
import type { OpportunityStageMenuProps } from '../../types/opportunity-detail'

export function OpportunityStageMenu({
  anchorEl,
  opportunity,
  onClose,
  onRequestStatusChange,
}: OpportunityStageMenuProps) {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      {opportunityStages
        .filter(({ status }) => status !== opportunity.status)
        .map((option) => (
          <MenuItem key={option.status} onClick={() => onRequestStatusChange(option.status)}>
            <Box
              sx={{
                width: 8,
                height: 8,
                mr: 1.2,
                borderRadius: `${radius.full}px`,
                bgcolor: option.color,
              }}
            />
            {option.label}
          </MenuItem>
        ))}
    </Menu>
  )
}
