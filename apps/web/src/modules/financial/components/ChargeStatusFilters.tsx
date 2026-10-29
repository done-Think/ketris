import { Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardStatusFilterButton } from '@shared/components/layout'

import { chargeStatusFilters } from '../config/charge-status'
import type { ChargeStatusFiltersProps } from '../types/charge'

export function ChargeStatusFilters({ value, counts, onChange }: ChargeStatusFiltersProps) {
  const t = useTranslations('charges')

  return (
    <Stack
      role="group"
      aria-label={t('filtersLabel')}
      direction="row"
      spacing={0.8}
      useFlexGap
      flexWrap="wrap"
    >
      {chargeStatusFilters.map((status) => (
        <DashboardStatusFilterButton
          key={status}
          active={value === status}
          count={counts?.[status]}
          onClick={() => onChange(status)}
        >
          {t(`statuses.${status}`)}
        </DashboardStatusFilterButton>
      ))}
    </Stack>
  )
}
