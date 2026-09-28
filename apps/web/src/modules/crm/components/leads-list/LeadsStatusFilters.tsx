import { Box, Button, MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { leadFilters } from '../../config/lead-filters'
import type { LeadsStatusFiltersProps } from '../../types/lead'
import { getLeadFilterCount } from '../../utils/leads'

export function LeadsStatusFilters({
  activeFilter,
  leads,
  onFilterChange,
}: LeadsStatusFiltersProps) {
  const t = useTranslations('crm.leads')
  const activeCount = getLeadFilterCount(leads, activeFilter)

  return (
    <>
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

      <Stack
        component="div"
        role="group"
        aria-label={t('filterAriaLabel')}
        direction="row"
        spacing={0.8}
        useFlexGap
        flexWrap="wrap"
        sx={{ display: { xs: 'none', sm: 'flex' }, mb: -0.25 }}
      >
        {leadFilters.map(({ label, labelKey }) => {
          const active = label === activeFilter
          const count = getLeadFilterCount(leads, label)

          return (
            <Button
              key={label}
              type="button"
              variant={active ? 'contained' : 'outlined'}
              aria-pressed={active}
              onClick={() => onFilterChange(label)}
              sx={{
                minHeight: 42,
                borderRadius: `${radius.full}px`,
                px: 1.8,
                gap: 0.6,
                fontSize: 17,
                fontWeight: 900,
              }}
            >
              {t(`filters.${labelKey}`)}
              <Box
                component="span"
                sx={{
                  display: 'grid',
                  minWidth: 24,
                  height: 24,
                  placeItems: 'center',
                  px: 0.5,
                  borderRadius: `${radius.full}px`,
                  bgcolor: active ? alpha.white[8] : alpha.graphite[6],
                  color: active ? surface.lightText : brand.neutral[500],
                  fontSize: 14.5,
                  fontWeight: 800,
                }}
              >
                {count}
              </Box>
            </Button>
          )
        })}
      </Stack>
    </>
  )
}

const selectSx = {
  width: { xs: '100%', sm: 160 },
  display: { xs: 'block', sm: 'none' },
  '& .MuiOutlinedInput-root': {
    minHeight: 46,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    color: brand.graphite[500],
    fontSize: 18,
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
    minHeight: 46,
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
