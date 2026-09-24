'use client'

import { useEffect, useState } from 'react'
import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useAgencySearch } from '../hooks/use-agency-search'
import type { AgencySearchResult } from '../services/registration-service'

export interface AgencyAutocompleteProps {
  value: AgencySearchResult | null
  onChange: (agency: AgencySearchResult | null) => void
}

export function AgencyAutocomplete({ value, onChange }: AgencyAutocompleteProps) {
  const t = useTranslations('auth.registerDetails')
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(inputValue), 300)
    return () => clearTimeout(timeout)
  }, [inputValue])

  const agenciesQuery = useAgencySearch(debouncedQuery)
  const options = agenciesQuery.data ?? []

  return (
    <Autocomplete
      value={value}
      onChange={(_event, next) => onChange(next)}
      inputValue={inputValue}
      onInputChange={(_event, next) => setInputValue(next)}
      options={options}
      loading={agenciesQuery.isFetching}
      getOptionLabel={(agency) => agency.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      noOptionsText={t('agency.noOptions')}
      loadingText={t('agency.loading')}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('agency.label')}
          placeholder={t('agency.placeholder')}
          helperText={t('agency.helper')}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {agenciesQuery.isFetching ? <CircularProgress size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}
