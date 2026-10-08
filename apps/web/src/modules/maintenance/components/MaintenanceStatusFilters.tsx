import { MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardStatusFilterButton } from '@shared/components/layout'
import { alpha, radius, shadows, surface, brand } from '@shared/theme/tokens'

import type { MaintenanceFilter, MaintenanceStatusFiltersProps } from '../types/maintenance'
import { MaintenanceFilterOptionLabel } from './MaintenanceFilterOptionLabel'

const maintenanceFilterValues: MaintenanceFilter['value'][] = [
  'all',
  'open',
  'inProgress',
  'urgent',
  'resolved',
  'closed',
]

export function MaintenanceStatusFilters({
  activeFilter,
  direction = 'row',
  getFilterCount,
  isDesktop = false,
  onChange,
}: MaintenanceStatusFiltersProps) {
  const t = useTranslations('dashboard.maintenance')
  const isColumn = direction === 'column'

  return (
    <>
      <TextField
        select
        size="small"
        value={activeFilter}
        onChange={(event) => onChange(event.target.value as MaintenanceFilter['value'])}
        sx={{
          display: isDesktop ? { xs: 'flex', md: 'none' } : 'flex',
          width: isColumn ? '100%' : { xs: '100%', sm: 160 },
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
          inputProps: { 'aria-label': t('filterDialog.title') },
          renderValue: () => (
            <MaintenanceFilterOptionLabel
              active
              count={getFilterCount(activeFilter)}
              label={t(`filters.${activeFilter}`)}
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
        {maintenanceFilterValues.map((value) => {
          const active = activeFilter === value

          return (
            <MenuItem
              key={value}
              value={value}
              sx={{
                minHeight: 42,
                bgcolor: active ? alpha.magenta[8] : 'transparent',
                '&:hover': {
                  bgcolor: alpha.magenta[8],
                },
              }}
            >
              <MaintenanceFilterOptionLabel
                active={active}
                count={getFilterCount(value)}
                label={t(`filters.${value}`)}
              />
            </MenuItem>
          )
        })}
      </TextField>

      {isDesktop ? (
        <Stack
          component="div"
          role="group"
          aria-label={t('filterDialog.title')}
          direction="row"
          spacing={0.8}
          useFlexGap
          flexWrap="wrap"
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          {maintenanceFilterValues.map((value) => {
            const active = activeFilter === value

            return (
              <DashboardStatusFilterButton
                key={value}
                active={active}
                count={getFilterCount(value)}
                onClick={() => onChange(value)}
              >
                {t(`filters.${value}`)}
              </DashboardStatusFilterButton>
            )
          })}
        </Stack>
      ) : null}
    </>
  )
}
