import { MenuItem, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'

import { DashboardStatusFilterButton } from '@shared/components/layout'
import { alpha, brand, motion, radius, shadows, surface } from '@shared/theme/tokens'

import { contractFilterTabs, contractTypeFilterOptions } from '../config/contract-ui'
import type { ContractsFiltersFormValues, ContractsFiltersProps } from '../types/contract'

export function ContractsFilters({ control, filterCounts, setValue }: ContractsFiltersProps) {
  const t = useTranslations('contracts.filters.tabs')
  const tType = useTranslations('contracts.filters.typeFilter')
  const status = useWatch({ control, name: 'status' })
  const period = useWatch({ control, name: 'period' })
  const type = useWatch({ control, name: 'type' })
  const activeTabValue =
    contractFilterTabs.find((tab) => tab.status === status && tab.period === period)?.label ??
    contractFilterTabs[0].label

  return (
    <Stack
      direction="row"
      spacing={0.8}
      useFlexGap
      flexWrap="wrap"
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 1.8,
      }}
    >
      <TextField
        select
        size="small"
        value={activeTabValue}
        onChange={(event) => {
          const selectedTab = contractFilterTabs.find((tab) => tab.label === event.target.value)

          if (selectedTab) {
            setValue('status', selectedTab.status, { shouldDirty: true })
            setValue('period', selectedTab.period, { shouldDirty: true })
            setValue('type', 'Todos', { shouldDirty: true })
          }
        }}
        sx={dashboardFilterSelectSx}
      >
        {contractFilterTabs.map((tab) => (
          <MenuItem key={tab.label} value={tab.label}>
            {t(tab.label)}
          </MenuItem>
        ))}
      </TextField>

      {contractFilterTabs.map((tab) => {
        const active = tab.status === status && tab.period === period

        return (
          <DashboardStatusFilterButton
            key={tab.label}
            active={active}
            count={filterCounts[tab.label]}
            onClick={() => {
              setValue('status', tab.status, { shouldDirty: true })
              setValue('period', tab.period, { shouldDirty: true })
              setValue('type', 'Todos', { shouldDirty: true })
            }}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              transition: motion.transition.bordered,
            }}
          >
            {t(tab.label)}
          </DashboardStatusFilterButton>
        )
      })}

      <TextField
        select
        size="small"
        value={type}
        onChange={(event) =>
          setValue('type', event.target.value as ContractsFiltersFormValues['type'], {
            shouldDirty: true,
          })
        }
        sx={{
          width: { xs: '100%', sm: 180 },
          ml: { sm: 'auto' },
          '& .MuiInputBase-root': {
            height: { xs: 40, sm: 32 },
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            color: brand.graphite[500],
            fontSize: 12,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha.graphite[8],
          },
        }}
        SelectProps={{
          inputProps: { 'aria-label': tType('label') },
        }}
      >
        {contractTypeFilterOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {tType(option)}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}

const dashboardFilterSelectSx = {
  width: { xs: '100%', sm: 160 },
  display: { xs: 'block', sm: 'none' },
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
  },
  '& .MuiMenu-paper': {
    mt: 0.6,
    borderRadius: `${radius.sm}px`,
    boxShadow: shadows.popover,
  },
}
