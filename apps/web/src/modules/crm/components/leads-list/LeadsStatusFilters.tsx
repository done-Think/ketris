import { useTranslations } from 'next-intl'
import { leadFilters } from '../../config/lead-filters'
import type { LeadsStatusFiltersProps } from '../../types/lead'
import { CrmStatusFilters } from '../CrmStatusFilters'

export function LeadsStatusFilters({
  activeFilter,
  counts,
  onFilterChange,
}: LeadsStatusFiltersProps) {
  const t = useTranslations('crm.leads')
  return (
    <CrmStatusFilters
      value={activeFilter}
      counts={counts}
      onChange={onFilterChange}
      ariaLabel={t('filterAriaLabel')}
      options={leadFilters.map((filter) => ({
        value: filter.label,
        label: t(`filters.${filter.labelKey}`),
      }))}
    />
  )
}
