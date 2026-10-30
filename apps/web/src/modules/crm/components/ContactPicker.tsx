'use client'

import { useState } from 'react'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useCrmContactOptions } from '../hooks/use-contacts'
import type { ContactPickerProps } from '../types/autocomplete'
import { CrmAutocomplete } from './CrmAutocomplete'

export function ContactPicker({ value, onChange, label, error, helperText }: ContactPickerProps) {
  const [input, setInput] = useState('')
  const query = useCrmContactOptions(useDebouncedValue(input))

  return (
    <CrmAutocomplete<{ id: string; name: string; email?: string }>
      value={value}
      options={(query.data ?? []).map(({ id, name, email }) => ({ id, name, email }))}
      onChange={(next) => onChange(next ? { id: next.id, name: next.name } : null)}
      onSearch={setInput}
      getOptionLabel={(contact) =>
        contact.email ? `${contact.name} — ${contact.email}` : contact.name
      }
      label={label}
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
