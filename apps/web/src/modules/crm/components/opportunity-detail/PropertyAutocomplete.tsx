'use client'

import { useEffect, useState } from 'react'
import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'

import { useCrmProperties } from '../../hooks/use-opportunities'
import type { PropertyAutocompleteProps } from '../../types/opportunity-detail'
import type { PublicPropertySummary } from '../../types/property'
import { formatCurrency, formatMonthlyCurrency } from '../../utils/formatters'

function getOptionLabel(property: PublicPropertySummary, locale: AppLocale): string {
  const location = [property.neighborhood, property.city].filter(Boolean).join(', ')
  const price =
    property.purpose === 'ALUGUEL'
      ? formatMonthlyCurrency(property.price, locale)
      : formatCurrency(property.price, locale)

  return [property.title, location, price].filter(Boolean).join(' — ')
}

export function PropertyAutocomplete({
  tenantId,
  value,
  onChange,
  error,
  helperText,
}: PropertyAutocompleteProps) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.opportunityDetail')
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(inputValue), 300)
    return () => clearTimeout(timeout)
  }, [inputValue])

  const propertiesQuery = useCrmProperties(tenantId, debouncedQuery ? { q: debouncedQuery } : {})
  const options = propertiesQuery.data ?? []

  return (
    <Autocomplete
      value={value}
      onChange={(_event, next) => onChange(next)}
      inputValue={inputValue}
      onInputChange={(_event, next) => setInputValue(next)}
      options={options}
      loading={propertiesQuery.isFetching}
      getOptionLabel={(property) => getOptionLabel(property, locale)}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      noOptionsText={t('noProperties')}
      loadingText={t('loadingProperties')}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('fields.property')}
          required
          error={error}
          helperText={helperText}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {propertiesQuery.isFetching ? <CircularProgress size={16} /> : null}
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
