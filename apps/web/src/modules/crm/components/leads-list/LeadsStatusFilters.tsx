import { Box, Button, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, surface } from '@shared/theme/tokens'

import { leadFilters } from '../../config/lead-filters'
import type { LeadsStatusFiltersProps } from '../../types/lead'
import { getLeadFilterCount } from '../../utils/leads'

export function LeadsStatusFilters({
  activeFilter,
  leads,
  onFilterChange,
}: LeadsStatusFiltersProps) {
  const t = useTranslations('crm.leads')

  return (
    <Stack
      component="div"
      role="group"
      aria-label={t('filterAriaLabel')}
      direction="row"
      spacing={1}
      sx={{ flexWrap: 'wrap', rowGap: 1 }}
    >
      {leadFilters.map(({ label, labelKey }) => {
        const active = label === activeFilter
        const count = getLeadFilterCount(leads, label)

        return (
          <Button
            key={label}
            type="button"
            variant={active ? 'contained' : 'outlined'}
            aria-pressed={active}
            onClick={() => onFilterChange(label)}
            sx={{
              minHeight: 34,
              borderRadius: `${radius.full}px`,
              px: 1.8,
              gap: 0.6,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {t(`filters.${labelKey}`)}
            <Box
              component="span"
              sx={{
                display: 'grid',
                minWidth: 20,
                height: 20,
                placeItems: 'center',
                px: 0.5,
                borderRadius: `${radius.full}px`,
                bgcolor: active ? alpha.white[8] : alpha.graphite[6],
                color: active ? surface.lightText : brand.neutral[500],
                fontSize: 10.5,
                fontWeight: 700,
              }}
            >
              {count}
            </Box>
          </Button>
        )
      })}
    </Stack>
  )
}
