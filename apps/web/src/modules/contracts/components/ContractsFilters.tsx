import { Box, Button } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { contractFilterTabs } from '../config/contract-ui'
import type { ContractsFiltersProps } from '../types/contract'

export function ContractsFilters({ control, setValue }: ContractsFiltersProps) {
  const t = useTranslations('contracts.filters.tabs')
  const status = useWatch({ control, name: 'status' })
  const period = useWatch({ control, name: 'period' })

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
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
    </Box>
  )
}
