import { useTranslations } from 'next-intl'
import { contactFilters } from '../../config/contact-filters'
import type { ContactsStatusFiltersProps } from '../../types/contact'
import { CrmStatusFilters } from '../CrmStatusFilters'

export function ContactsStatusFilters({
  activeFilter,
  counts,
  onFilterChange,
}: ContactsStatusFiltersProps) {
  const t = useTranslations('crm.contacts')
  return (
    <CrmStatusFilters
      value={activeFilter}
      counts={counts}
      onChange={onFilterChange}
      ariaLabel={t('filterAriaLabel')}
      options={contactFilters.map((filter) => ({
        value: filter.label,
        label: t(`filters.${filter.labelKey}`),
      }))}
    />
  )
}
