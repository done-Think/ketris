import { Box, MenuItem, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { propertyStatusFilters } from '../data/dashboard-properties'
import type { PropertyStatusFiltersProps } from '../types/dashboard-property'

export function PropertyStatusFilters({
  activeStatusFilter,
  statusFilterCounts,
  onStatusFilterChange,
}: PropertyStatusFiltersProps) {
  const t = useTranslations('properties.dashboard.filters')

  return (
    <TextField
      select
      size="small"
      value={activeStatusFilter}
      onChange={(event) => onStatusFilterChange(event.target.value as typeof activeStatusFilter)}
      sx={{
        width: { xs: '100%', sm: 250 },
        mb: 1.8,
        '& .MuiOutlinedInput-root': {
          minHeight: 46,
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.paper,
          color: brand.graphite[500],
          fontSize: 14,
          fontWeight: 800,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
            borderWidth: 0,
          },
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
          borderWidth: 0,
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'transparent',
        },
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
        },
      }}
      SelectProps={{
        renderValue: () => (
          <FilterOptionLabel
            label={t(activeStatusFilter)}
            count={statusFilterCounts[activeStatusFilter]}
            active
          />
        ),
        MenuProps: {
          PaperProps: {
            sx: {
              mt: 0.6,
              borderRadius: `${radius.sm}px`,
              boxShadow: shadows.popover,
            },
          },
        },
      }}
    >
      {propertyStatusFilters.map((filter) => {
        const active = filter.label === activeStatusFilter

        return (
          <MenuItem
            key={filter.label}
            value={filter.label}
            sx={{
              minHeight: 42,
              bgcolor: active ? alpha.magenta[8] : 'transparent',
              '&:hover': {
                bgcolor: alpha.magenta[8],
              },
            }}
          >
            <FilterOptionLabel
              label={t(filter.label)}
              count={statusFilterCounts[filter.label]}
              active={active}
            />
          </MenuItem>
        )
      })}
    </TextField>
  )
}

function FilterOptionLabel({
  active,
  count,
  label,
}: {
  active: boolean
  count: number
  label: string
}) {
  return (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
      <Box component="span">{label}</Box>
      <Box
        component="span"
        sx={{
          display: 'grid',
          minWidth: 22,
          height: 22,
          placeItems: 'center',
          px: 0.6,
          borderRadius: `${radius.full}px`,
          bgcolor: active ? brand.magenta[500] : alpha.graphite[6],
          color: active ? surface.lightText : brand.neutral[500],
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        {count}
      </Box>
    </Box>
  )
}
