import { Box, MenuItem, Stack, TextField } from '@mui/material'
import * as crmStyles from '../styles/crm-status-filters.styles'

import { DashboardStatusFilterButton } from '@shared/components/layout'

import type { CrmFilterOptionLabelProps, CrmStatusFiltersProps } from '../types/status-filters'

export function CrmStatusFilters<T extends string>({
  value: activeFilter,
  counts,
  onChange: onFilterChange,
  options,
  ariaLabel,
}: CrmStatusFiltersProps<T>) {
  const activeCount = counts[activeFilter] ?? 0
  return (
    <>
      <TextField
        select
        size="small"
        value={activeFilter}
        onChange={(event) => onFilterChange(event.target.value as typeof activeFilter)}
        sx={crmStyles.selectSx}
        SelectProps={{
          inputProps: { 'aria-label': ariaLabel },
          renderValue: () => (
            <FilterOptionLabel
              label={options.find((option) => option.value === activeFilter)?.label ?? ''}
              count={activeCount}
              active
            />
          ),
          MenuProps: crmStyles.menuProps,
        }}
      >
        {options.map(({ value: label, label: text }) => {
          const active = label === activeFilter
          const count = counts[label] ?? 0

          return (
            <MenuItem key={label} value={label} sx={crmStyles.menuItemSx(active)}>
              <FilterOptionLabel label={text} count={count} active={active} />
            </MenuItem>
          )
        })}
      </TextField>

      <Stack
        component="div"
        role="group"
        aria-label={ariaLabel}
        direction="row"
        spacing={0.8}
        useFlexGap
        flexWrap="wrap"
        sx={crmStyles.stackSx}
      >
        {options.map(({ value: label, label: text }) => {
          const active = label === activeFilter
          const count = counts[label] ?? 0

          return (
            <DashboardStatusFilterButton
              key={label}
              active={active}
              count={count}
              onClick={() => onFilterChange(label)}
            >
              {text}
            </DashboardStatusFilterButton>
          )
        })}
      </Stack>
    </>
  )
}

function FilterOptionLabel({ active, count, label }: CrmFilterOptionLabelProps) {
  return (
    <Box component="span" sx={crmStyles.boxSx}>
      <Box component="span">{label}</Box>
      <Box component="span" sx={crmStyles.getBoxSx(active)}>
        {count}
      </Box>
    </Box>
  )
}
