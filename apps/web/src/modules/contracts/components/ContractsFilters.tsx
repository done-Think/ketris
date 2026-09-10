import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
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

      <FormControl size="small" sx={{ minWidth: 168, ml: { sm: 'auto' } }}>
        <InputLabel id="contracts-type-filter-label">{tType('label')}</InputLabel>
        <Select
          labelId="contracts-type-filter-label"
          label={tType('label')}
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
