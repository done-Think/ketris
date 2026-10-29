'use client'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useCrmContactOptions } from '../../hooks/use-contacts'
import type { CrmContactAutocompleteProps } from '../../types/autocomplete'
import { CrmAutocomplete } from '../CrmAutocomplete'

export function ContactAutocomplete({
  value,
  onChange,
  error,
  helperText,
}: CrmContactAutocompleteProps) {
  const t = useTranslations('crm.opportunityDetail')
  const [input, setInput] = useState('')
  const q = useDebouncedValue(input)
  const query = useCrmContactOptions(q)
  return (
    <CrmAutocomplete
      value={value}
      options={(query.data ?? []).map(({ id, name, email, phone }) => ({ id, name, email, phone }))}
      onChange={onChange}
      onSearch={setInput}
      getOptionLabel={(contact) => `${contact.name} — ${contact.email}`}
      label={t('fields.contactSelection')}
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
