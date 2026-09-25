import { Box, Button, FormControl, MenuItem, Select, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { contractFilterTabs, contractTypeFilterOptions } from '../config/contract-ui'
import type { ContractsFiltersFormValues, ContractsFiltersProps } from '../types/contract'

export function ContractsFilters({ control, setValue }: ContractsFiltersProps) {
  const t = useTranslations('contracts.filters.tabs')
  const tType = useTranslations('contracts.filters.typeFilter')
  const status = useWatch({ control, name: 'status' })
  const period = useWatch({ control, name: 'period' })
  const type = useWatch({ control, name: 'type' })
  const activeTabValue =
    contractFilterTabs.find((tab) => tab.status === status && tab.period === period)?.label ??
    contractFilterTabs[0].label

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        mb: 2.4,
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
          <Button
            key={tab.label}
            type="button"
            variant={active ? 'contained' : 'outlined'}
            onClick={() => {
              setValue('status', tab.status, { shouldDirty: true })
              setValue('period', tab.period, { shouldDirty: true })
              setValue('type', 'Todos', { shouldDirty: true })
            }}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              minHeight: 36,
              borderRadius: `${radius.full}px`,
              borderColor: active ? brand.magenta[500] : alpha.graphite[8],
              bgcolor: active ? brand.magenta[500] : surface.paper,
              boxShadow: shadows.none,
              color: active ? surface.lightText : brand.neutral[500],
              px: 2.1,
              py: 0.5,
              fontSize: 14,
              fontWeight: 900,
              textTransform: 'none',
              '&:hover': {
                borderColor: brand.magenta[500],
                bgcolor: active ? brand.magenta[500] : alpha.magenta[6],
                color: active ? surface.lightText : brand.magenta[500],
              },
            }}
          >
            {t(tab.label)}
          </Button>
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
        sx={{ ...dashboardFilterSelectSx, ml: { sm: 'auto' } }}
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

      <FormControl
        size="small"
        sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 168, ml: 'auto' }}
      >
        <Select
          aria-label={tType('label')}
          displayEmpty
          value={type}
          onChange={(event) =>
            setValue('type', event.target.value as ContractsFiltersFormValues['type'], {
              shouldDirty: true,
            })
          }
          sx={{
            height: 36,
            borderRadius: `${radius.full}px`,
            bgcolor: surface.paper,
            fontSize: 14,
            fontWeight: 800,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha.graphite[8] },
          }}
        >
          {contractTypeFilterOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {tType(option)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
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
