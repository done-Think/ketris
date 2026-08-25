import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import { Box, Paper, Stack, Typography } from '@mui/material'

import { brand, iconSize, radius } from '@shared/theme/tokens'

import type { ProposalSpecialConditionsPanelProps } from '../../types/proposal-management'
import {
  proposalPanelHeaderSx,
  proposalPanelSx,
  proposalPanelTitleSx,
} from './proposal-detail.styles'

export function ProposalSpecialConditionsPanel({
  conditions,
}: ProposalSpecialConditionsPanelProps) {
  return (
    <Paper
      component="section"
      aria-labelledby="proposal-special-conditions-title"
      elevation={0}
      sx={{ ...proposalPanelSx, minHeight: { sm: 180 }, p: { xs: 2, sm: 2.5 } }}
    >
      <Stack direction="row" alignItems="center" gap={1} sx={proposalPanelHeaderSx}>
        <SecurityOutlinedIcon
          aria-hidden="true"
          sx={{ color: brand.magenta[500], fontSize: iconSize.sm }}
        />
        <Typography id="proposal-special-conditions-title" component="h2" sx={proposalPanelTitleSx}>
          Condições Especiais
        </Typography>
      </Stack>

      <Stack component="ul" spacing={0.875} sx={{ m: 0, mt: 2, p: 0, listStyle: 'none' }}>
        {conditions.map((condition) => (
          <Stack component="li" key={condition} direction="row" alignItems="flex-start" gap={1}>
            <Box
              aria-hidden="true"
              sx={{
                width: 5,
                height: 5,
                mt: '6px',
                flexShrink: 0,
                borderRadius: `${radius.full}px`,
                bgcolor: brand.magenta[500],
              }}
            />
            <Typography
              sx={{
                color: brand.graphite[500],
                fontSize: 12,
                fontWeight: 400,
                lineHeight: 1.5,
              }}
            >
              {condition}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
