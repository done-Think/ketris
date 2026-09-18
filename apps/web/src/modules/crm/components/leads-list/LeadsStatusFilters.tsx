import { Box, MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { leadFilters } from '../../config/lead-filters'
import type { LeadsStatusFiltersProps } from '../../types/lead'
import { getLeadFilterCount } from '../../utils/leads'

export function LeadsStatusFilters({
  activeFilter,
  leads,
  sortOption,
  onFilterChange,
  onSortChange,
}: LeadsStatusFiltersProps) {
  const t = useTranslations('crm.leads')
  const activeCount = getLeadFilterCount(leads, activeFilter)

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ width: '100%' }}>
      <TextField
        select
        size="small"
        value={activeFilter}
        onChange={(event) => onFilterChange(event.target.value as typeof activeFilter)}
        sx={selectSx}
        SelectProps={{
          inputProps: { 'aria-label': t('filterAriaLabel') },
          renderValue: () => (
            <FilterOptionLabel
              label={t(
                `filters.${leadFilters.find((filter) => filter.label === activeFilter)?.labelKey ?? 'all'}`,
              )}
              count={activeCount}
              active
            />
          ),
          MenuProps: menuProps,
        }}
      >
        {leadFilters.map(({ label, labelKey }) => {
          const active = label === activeFilter
          const count = getLeadFilterCount(leads, label)

          return (
            <MenuItem key={label} value={label} sx={menuItemSx(active)}>
              <FilterOptionLabel label={t(`filters.${labelKey}`)} count={count} active={active} />
            </MenuItem>
          )
        })}
      </TextField>

      <TextField
        select
        size="small"
        value={sortOption}
        onChange={(event) => onSortChange(event.target.value as typeof sortOption)}
        sx={selectSx}
        SelectProps={{
          inputProps: { 'aria-label': t('sort.ariaLabel') },
          renderValue: () => t(`sort.options.${sortOption}`),
          MenuProps: menuProps,
        }}
      >
        {(['relevance', 'nameAsc'] as const).map((option) => (
          <MenuItem key={option} value={option} sx={menuItemSx(option === sortOption)}>
            {t(`sort.options.${option}`)}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}

const selectSx = {
  width: { xs: '100%', sm: 250 },
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
}

const menuProps = {
  PaperProps: {
    sx: {
      mt: 0.6,
      borderRadius: `${radius.sm}px`,
      boxShadow: shadows.popover,
    },
  },
}

function menuItemSx(active: boolean) {
  return {
    minHeight: 42,
    bgcolor: active ? alpha.magenta[8] : 'transparent',
    '&:hover': {
      bgcolor: alpha.magenta[8],
    },
  }
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
