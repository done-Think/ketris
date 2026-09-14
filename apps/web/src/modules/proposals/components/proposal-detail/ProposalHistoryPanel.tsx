import { Box, Paper, Stack, Typography } from '@mui/material'

import { brand, radius } from '@shared/theme/tokens'

import type { ProposalHistoryPanelProps } from '../../types/proposal-management'
import {
  proposalPanelHeaderSx,
  proposalPanelSx,
  proposalPanelTitleSx,
} from './proposal-detail.styles'

export function ProposalHistoryPanel({ entries }: ProposalHistoryPanelProps) {
  return (
    <Paper
      component="section"
      aria-labelledby="proposal-history-title"
      elevation={0}
      sx={{ ...proposalPanelSx, minHeight: { sm: 252 }, p: { xs: 2, sm: 2.5 } }}
    >
      <Box sx={proposalPanelHeaderSx}>
        <Typography id="proposal-history-title" component="h2" sx={proposalPanelTitleSx}>
          Histórico
        </Typography>
      </Box>

      <Stack component="ol" sx={{ m: 0, mt: 1.75, p: 0, listStyle: 'none' }}>
        {entries.map((entry, index) => (
          <Stack
            component="li"
            key={entry.id}
            direction="row"
            gap={1.25}
            aria-current={entry.isCurrent ? 'step' : undefined}
            sx={{ minHeight: 52 }}
          >
            <Stack alignItems="center" sx={{ width: 8, flexShrink: 0 }}>
              <Box
                aria-hidden="true"
                sx={{
                  width: 6,
                  height: 6,
                  flexShrink: 0,
                  borderRadius: `${radius.full}px`,
                  bgcolor: entry.isCurrent ? brand.magenta[500] : brand.neutral[400],
                }}
              />
              {index < entries.length - 1 ? (
                <Box sx={{ width: '1px', minHeight: 40, flex: 1, bgcolor: brand.neutral[200] }} />
              ) : null}
            </Stack>

            <Box sx={{ minWidth: 0, flex: 1, pb: index < entries.length - 1 ? 1.25 : 0 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'baseline' }}
                justifyContent="space-between"
                gap={{ xs: 0.125, sm: 1 }}
              >
                <Typography
                  sx={{
                    color: brand.graphite[500],
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.35,
                  }}
                >
                  {entry.title}
                </Typography>
                <Typography
                  sx={{
                    flexShrink: 0,
                    color: brand.neutral[400],
                    fontSize: 9.5,
                    fontWeight: 400,
                    lineHeight: 1.35,
                  }}
                >
                  {entry.dateLabel}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  mt: 0.25,
                  color: brand.neutral[500],
                  fontSize: 10,
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}
              >
                {entry.description}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Paper>
  )
}
