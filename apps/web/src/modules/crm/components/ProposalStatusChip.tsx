import { Chip } from '@mui/material'

import { radius } from '@shared/theme/tokens'

import { proposalStatusPresentations } from '../config/proposal-statuses'
import type { ProposalStatusChipProps } from '../types/proposal-management'

export function ProposalStatusChip({ status }: ProposalStatusChipProps) {
  const presentation = proposalStatusPresentations[status]

  return (
    <Chip
      label={presentation.label}
      size="small"
      sx={{
        height: 22,
        borderRadius: `${radius.full}px`,
        bgcolor: presentation.backgroundColor,
        color: presentation.color,
        fontSize: 10.5,
        fontWeight: 700,
        '& .MuiChip-label': { px: 1.125 },
      }}
    />
  )
}
