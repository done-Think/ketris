'use client'

import { Alert, Autocomplete, Button, CircularProgress, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useAgendaProperties } from '../hooks/use-agenda-properties'
import { agendaOtherPropertyValue } from '../schemas/agenda-event-form-schema'
import type { AgendaPropertyFieldProps, AgendaPropertyOption } from '../types/agenda-event'

export function AgendaPropertyField({
  control,
  internal,
  propertyOptions,
}: AgendaPropertyFieldProps) {
  const t = useTranslations('agenda.eventForm')
  const [inputText, setInputText] = useState<string | null>(null)
  const [selectedOption, setSelectedOption] = useState<AgendaPropertyOption | null>(null)
  const search = inputText ?? ''
  const query = useAgendaProperties(useDebouncedValue(search))
  const loaded =
    query.data?.pages.flatMap((page) =>
      page.items.map((item): AgendaPropertyOption => ({
        ...item,
        href: { pathname: '/dashboard/properties/[id]', params: { id: item.id } },
      })),
    ) ?? []
  const options = [
    ...new Map(
      [
        ...propertyOptions.filter((option) =>
          option.label.toLowerCase().includes(search.trim().toLowerCase()),
        ),
        ...loaded,
      ].map((item) => [item.id, item]),
    ).values(),
  ]
  const other = {
    id: agendaOtherPropertyValue,
    label: t('fields.otherProperty'),
    href: '/dashboard/properties' as const,
  }

  return (
    <Stack spacing={1}>
      <Controller
        control={control}
        name="propertyId"
        render={({ field, fieldState }) => {
          const value =
            field.value === agendaOtherPropertyValue
              ? other
              : ((selectedOption?.id === field.value
                  ? selectedOption
                  : options.find((item) => item.id === field.value)) ??
                (field.value
                  ? {
                      id: field.value,
                      label: t('fields.currentProperty'),
                      href: '/dashboard/properties' as const,
                    }
                  : null))
          const candidates = query.allowCustom === false ? [...options] : [...options, other]
          if (value && !candidates.some((item) => item.id === value.id)) candidates.unshift(value)
          return (
            <Autocomplete
              options={candidates}
              value={value}
              loading={query.isFetching}
              inputValue={inputText ?? value?.label ?? ''}
              isOptionEqualToValue={(option, selected) => option.id === selected.id}
              getOptionLabel={(option) => option.label}
              filterOptions={(options) => options}
              onChange={(_, value) => {
                setSelectedOption(value)
                setInputText(null)
                field.onChange(value?.id ?? '')
              }}
              onInputChange={(_, value, reason) => {
                if (reason === 'input' || reason === 'clear') setInputText(value)
              }}
              onBlur={field.onBlur}
              openText={t('propertyOpen')}
              closeText={t('propertyClose')}
              clearText={t('propertyClear')}
              loadingText={t('propertiesLoading')}
              noOptionsText={t('propertiesEmpty')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={field.ref}
                  name={field.name}
                  label={internal ? t('fields.optionalProperty') : t('fields.property')}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {query.isFetching ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )
        }}
      />
      {query.isError && (
        <Alert severity="error">
          {t('propertiesError')}
          <Button onClick={() => query.refetch()}>{t('propertiesRetry')}</Button>
        </Alert>
      )}
      {query.hasNextPage && (
        <Button disabled={query.isFetching} onClick={() => query.fetchNextPage()}>
          {t('propertiesMore')}
        </Button>
      )}
    </Stack>
  )
}
