import { MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as maintenanceStyles from '../styles/maintenance-status-filters.styles'

import { DashboardStatusFilterButton } from '@shared/components/layout'

import type { MaintenanceFilter, MaintenanceStatusFiltersProps } from '../types/maintenance'
import { MaintenanceFilterOptionLabel } from './MaintenanceFilterOptionLabel'

const maintenanceFilterValues: MaintenanceFilter['value'][] = [
  'all',
  'open',
  'inProgress',
  'pendingConfirmation',
  'contested',
  'cancelled',
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
        sx={maintenanceStyles.extraStyleSx2(isDesktop, isColumn)}
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
              sx: maintenanceStyles.extraStyleSx1,
            },
          },
        }}
      >
        {maintenanceFilterValues.map((value) => {
          const active = activeFilter === value

          return (
            <MenuItem key={value} value={value} sx={maintenanceStyles.getMenuItemSx(active)}>
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
          sx={maintenanceStyles.stackSx}
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
