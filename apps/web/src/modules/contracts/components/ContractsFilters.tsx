import { Box, Button, FormControl, MenuItem, Select, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'

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
          <Button
            key={tab.label}
            type="button"
            variant="contained"
            onClick={() => {
              setValue('status', tab.status, { shouldDirty: true })
              setValue('period', tab.period, { shouldDirty: true })
              setValue('type', 'Todos', { shouldDirty: true })
            }}
            sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              minHeight: 42,
              borderRadius: `${radius.full}px`,
              boxShadow: 'none',
              px: 1.8,
              gap: 0.6,
              fontSize: 17,
              fontWeight: 900,
              bgcolor: active ? 'primary.main' : alpha.graphite[6],
              color: active ? surface.lightText : brand.graphite[500],
              textTransform: 'none',
              transition: motion.transition.bordered,
              '&:hover': {
                bgcolor: active ? 'primary.main' : alpha.graphite[10],
                boxShadow: 'none',
              },
            }}
          >
            {t(tab.label)}
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
              {filterCounts[tab.label]}
            </Box>
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
            height: 42,
            borderRadius: `${radius.full}px`,
            bgcolor: surface.paper,
            fontSize: 17,
            fontWeight: 900,
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
