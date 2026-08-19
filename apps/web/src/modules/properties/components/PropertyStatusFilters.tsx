import { Chip, Stack } from '@mui/material'

import { alpha, motion, radius, surface } from '@shared/theme/tokens'

import { propertyStatusFilters } from '../data/dashboard-properties'
import type { PropertyStatusFiltersProps } from '../types/dashboard-property'

export function PropertyStatusFilters({
  activeStatusFilter,
  statusFilterCounts,
  onStatusFilterChange,
}: PropertyStatusFiltersProps) {
  return (
    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" sx={{ mb: 1.8 }}>
      {propertyStatusFilters.map((filter) => {
        const active = filter.label === activeStatusFilter

        return (
          <Chip
            key={filter.label}
            clickable
            label={`${filter.label} ${statusFilterCounts[filter.label]}`}
            onClick={() => onStatusFilterChange(filter.label)}
            sx={{
              height: 38,
              borderRadius: `${radius.full}px`,
              bgcolor: active ? 'primary.main' : surface.paper,
              border: '1px solid',
              borderColor: active ? 'primary.main' : 'divider',
              color: active ? surface.lightText : 'text.primary',
              fontSize: 14.5,
              fontWeight: 900,
              transition: motion.transition.bordered,
              '&:hover': {
                bgcolor: active ? 'primary.dark' : alpha.magenta[6],
                borderColor: active ? 'primary.dark' : 'primary.main',
              },
            }}
          />
        )
      })}
    </Stack>
  )
}
