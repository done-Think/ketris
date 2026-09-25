import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'
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
        component="div"
        role="group"
        aria-label={t('filterAriaLabel')}
        direction="row"
        spacing={0.8}
        useFlexGap
        flexWrap="wrap"
        sx={{ display: { xs: 'none', sm: 'flex' }, mb: 1.8 }}
      >
        {propertyStatusFilters.map((filter) => {
          const active = filter.label === activeStatusFilter

          return (
            <Button
              key={filter.label}
              type="button"
              variant={active ? 'contained' : 'outlined'}
              aria-pressed={active}
              onClick={() => onStatusFilterChange(filter.label)}
              sx={{
                minHeight: 38,
                borderRadius: `${radius.full}px`,
                px: 1.8,
                gap: 0.6,
                fontSize: 13,
                fontWeight: 900,
                boxShadow: 'none',
                transition: motion.transition.bordered,
                '&:hover': { boxShadow: 'none' },
              }}
            >
              {t(filter.label)}
              <Box
                component="span"
                sx={{
                  display: 'grid',
                  minWidth: 20,
                  height: 20,
                  placeItems: 'center',
                  px: 0.5,
                  borderRadius: `${radius.full}px`,
                  bgcolor: active ? alpha.white[8] : alpha.graphite[6],
                  color: active ? surface.lightText : brand.neutral[500],
                  fontSize: 10.5,
                  fontWeight: 800,
                }}
              >
                {statusFilterCounts[filter.label]}
              </Box>
            </Button>
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
          minWidth: 26,
          height: 26,
          placeItems: 'center',
          px: 0.6,
          borderRadius: `${radius.full}px`,
          bgcolor: active ? brand.magenta[500] : alpha.graphite[6],
          color: active ? surface.lightText : brand.neutral[500],
          fontSize: 15,
          fontWeight: 900,
        }}
      >
        {count}
      </Box>
    </Box>
  )
}
