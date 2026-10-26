'use client'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useCrmFormatter } from '../../hooks/use-crm-formatter'
import { useCrmProperties } from '../../hooks/use-opportunities'
import type { PropertyAutocompleteProps } from '../../types/opportunity-detail'
import { CrmAutocomplete } from '../CrmAutocomplete'

export function PropertyAutocomplete({
  tenantId,
  value,
  onChange,
  error,
  helperText,
}: PropertyAutocompleteProps) {
  const t = useTranslations('crm.opportunityDetail')
  const format = useCrmFormatter()
  const [input, setInput] = useState('')
  const q = useDebouncedValue(input)
  const query = useCrmProperties(tenantId, q ? { q } : {})
  return (
    <CrmAutocomplete
      value={value}
      options={query.data ?? []}
      onChange={onChange}
      onSearch={setInput}
      getOptionLabel={(property) =>
        [
          property.title,
          [property.neighborhood, property.city].filter(Boolean).join(', '),
          format.money(property.price, property.purpose === 'ALUGUEL'),
        ]
          .filter(Boolean)
          .join(' — ')
      }
      label={t('fields.property')}
      required
      loading={query.isFetching}
      loadError={query.isError}
      hasNextPage={query.hasNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
      onLoadMore={() => void query.fetchNextPage()}
      onRetry={() => void query.refetch()}
      error={error}
      helperText={helperText}
    />
  )
}
