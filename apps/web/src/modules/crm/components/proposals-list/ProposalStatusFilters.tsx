import { Box, Button, Stack } from '@mui/material'

import { alpha, brand, radius, surface } from '@shared/theme/tokens'

import { proposalStatusFilters } from '../../config/proposal-statuses'
import type { ProposalStatusFiltersProps } from '../../types/proposal-management'

export function ProposalStatusFilters({
  activeStatus,
  summary,
  onStatusChange,
}: ProposalStatusFiltersProps) {
  return (
    <Stack
      component="div"
      role="group"
      aria-label="Filtrar propostas por status"
      direction="row"
      spacing={0.75}
      sx={{ mt: 2, overflowX: 'auto', pb: 0.25, scrollbarWidth: 'thin' }}
    >
      {proposalStatusFilters.map(({ id, label }) => {
        const active = id === activeStatus
        const count = id === 'all' ? summary.totalCount : summary.statusCounts[id]

        return (
          <Button
            key={id}
            type="button"
            variant="text"
            aria-pressed={active}
            onClick={() => onStatusChange(id)}
            sx={{
              minWidth: 0,
              height: 30,
              px: 1.4,
              flexShrink: 0,
              gap: 0.75,
              borderRadius: `${radius.full}px`,
              bgcolor: active ? brand.magenta[500] : brand.neutral[50],
              color: active ? surface.lightText : brand.graphite[500],
              fontSize: 11.5,
              fontWeight: active ? 700 : 500,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: active ? brand.magenta[600] : brand.neutral[100],
              },
            }}
          >
            {label}
            <Box
              component="span"
              sx={{
                display: 'grid',
                minWidth: 18,
                height: 18,
                placeItems: 'center',
                px: 0.5,
                borderRadius: `${radius.full}px`,
                bgcolor: active ? alpha.white[8] : alpha.graphite[6],
                color: active ? surface.lightText : brand.neutral[500],
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {count}
            </Box>
          </Button>
        )
      })}
    </Stack>
  )
}
