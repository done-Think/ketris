import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { IconButton, Stack, Tooltip } from '@mui/material'
import NextLink from 'next/link'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import type { ProposalActionsProps } from '../../types/proposal-management'

export function ProposalActions({
  proposal,
  onViewProposal,
  onOpenMoreOptions,
}: ProposalActionsProps) {
  const buttonSx = {
    width: 28,
    height: 28,
    border: '1px solid',
    borderColor: brand.neutral[100],
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.app,
    color: brand.neutral[500],
    '&:hover': {
      borderColor: brand.neutral[200],
      bgcolor: alpha.graphite[6],
      color: brand.graphite[500],
    },
    '&.Mui-disabled': {
      borderColor: brand.neutral[100],
      bgcolor: surface.app,
      color: brand.neutral[500],
      opacity: 1,
    },
  } as const

  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.75}>
      <Tooltip title={`Visualizar ${proposal.reference}`}>
        <IconButton
          component={NextLink}
          href={`/crm/proposals/${proposal.id}`}
          aria-label={`Visualizar ${proposal.reference}`}
          size="small"
          onClick={() => onViewProposal?.(proposal)}
          sx={buttonSx}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: iconSize.sm }} />
        </IconButton>
      </Tooltip>

      <Tooltip title={`Mais opções para ${proposal.reference}`}>
        <span>
          <IconButton
            type="button"
            aria-label={`Mais opções para ${proposal.reference}`}
            size="small"
            disabled={!onOpenMoreOptions}
            onClick={() => onOpenMoreOptions?.(proposal)}
            sx={buttonSx}
          >
            <MoreHorizRoundedIcon sx={{ fontSize: iconSize.sm }} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )
}
