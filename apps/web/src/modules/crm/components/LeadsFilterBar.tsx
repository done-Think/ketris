import { Button, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import { radius } from '@shared/theme/tokens'

import { leadStatusFilters } from '../config/lead-dashboard-ui'
import type { LeadsFilterBarProps } from '../types/lead'
import { getFilterCount } from '../utils/lead-dashboard'

export function LeadsFilterBar({ activeFilter, leads, onFilterChange }: LeadsFilterBarProps) {
  const t = useTranslations('crm.leads')

  return (
    <Stack
      direction="row"
      sx={{
        flexWrap: 'wrap',
        gap: 1,
        justifyContent: { xs: 'center', md: 'flex-start' },
      }}
    >
      {leadStatusFilters.map((filter) => {
        const active = activeFilter === filter.label

        return (
          <Button
            key={filter.label}
            type="button"
            variant={active ? 'contained' : 'outlined'}
            onClick={() => onFilterChange(filter.label)}
            sx={{
              minHeight: 34,
              borderRadius: `${radius.full}px`,
              px: 1.8,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {t(`filters.${filter.labelKey}`)} {getFilterCount(leads, filter.label)}
          </Button>
        )
      })}
    </Stack>
  )
}
