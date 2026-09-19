import { Box, Chip, MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

import { propertyStatusFilters } from '../data/dashboard-properties'
import type { PropertyStatusFiltersProps } from '../types/dashboard-property'

export function PropertyStatusFilters({
  activeStatusFilter,
  statusFilterCounts,
  onStatusFilterChange,
}: PropertyStatusFiltersProps) {
  const t = useTranslations('properties.dashboard.filters')

  return (
    <>
      <TextField
        select
        size="small"
        value={activeStatusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value as typeof activeStatusFilter)}
        sx={{
          display: { xs: 'block', sm: 'none' },
          width: '100%',
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

      <Stack
        direction="row"
        spacing={0.8}
        useFlexGap
        flexWrap="wrap"
        sx={{ display: { xs: 'none', sm: 'flex' }, mb: 1.8 }}
      >
        {propertyStatusFilters.map((filter) => {
          const active = filter.label === activeStatusFilter

          return (
            <Chip
              key={filter.label}
              clickable
              label={`${t(filter.label)} ${statusFilterCounts[filter.label]}`}
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
    </>
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
