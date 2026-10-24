import { styles, getMenuItemStyles, getCountStyles } from '../styles/property-status-filters.styles'
import { Box, MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardStatusFilterButton } from '@shared/components/layout'

import { propertyStatusFilters } from '../config/dashboard-property-ui'
import type {
  PropertyStatusFiltersProps,
  PropertyFilterOptionLabelProps,
} from '../types/dashboard-property'

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
        sx={styles.textField}
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
              sx: styles.menuPaper,
            },
          },
        }}
      >
        {propertyStatusFilters.map((filter) => {
          const active = filter.label === activeStatusFilter

          return (
            <MenuItem key={filter.label} value={filter.label} sx={getMenuItemStyles(active)}>
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
        sx={styles.stack}
      >
        {propertyStatusFilters.map((filter) => {
          const active = filter.label === activeStatusFilter

          return (
            <DashboardStatusFilterButton
              key={filter.label}
              active={active}
              count={statusFilterCounts[filter.label]}
              onClick={() => onStatusFilterChange(filter.label)}
              sx={styles.dashboardStatusFilterButton}
            >
              {t(filter.label)}
            </DashboardStatusFilterButton>
          )
        })}
      </Stack>
    </>
  )
}

function FilterOptionLabel({ active, count, label }: PropertyFilterOptionLabelProps) {
  return (
    <Box component="span" sx={styles.box}>
      <Box component="span">{label}</Box>
      <Box component="span" sx={getCountStyles(active)}>
        {count}
      </Box>
    </Box>
  )
}
