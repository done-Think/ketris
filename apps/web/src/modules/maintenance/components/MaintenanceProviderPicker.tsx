'use client'

import { Alert, Autocomplete, Button, Stack, TextField } from '@mui/material'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { useMaintenanceProviderOptions } from '../hooks/use-maintenance-providers'
import type { MaintenanceProviderPickerProps } from '../types/maintenance-workflow'

export function MaintenanceProviderPicker({ control, ticketId }: MaintenanceProviderPickerProps) {
  const t = useTranslations('dashboard.maintenance.providers')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const query = useMaintenanceProviderOptions(ticketId, debouncedSearch)
  const options = query.data?.pages.flatMap((page) => page.items) ?? []
  return (
    <Stack spacing={1}>
      <Controller
        control={control}
        name="catalogProvider"
        render={({ field, fieldState }) => (
          <Autocomplete
            value={field.value}
            options={options}
            onChange={(_event, value) => field.onChange(value)}
            onBlur={field.onBlur}
            onInputChange={(_event, value, reason) => {
              if (reason === 'input' || reason === 'clear') setSearch(value)
            }}
            getOptionLabel={(item) => item.name}
            isOptionEqualToValue={(item, value) => item.id === value.id}
            filterOptions={(items) => items}
            loading={query.isFetching}
            loadingText={t('loading')}
            noOptionsText={t('empty')}
            openText={t('open')}
            closeText={t('closeOptions')}
            clearText={t('clear')}
            renderInput={(params) => (
              <TextField
                {...params}
                inputRef={field.ref}
                label={t('select')}
                helperText={fieldState.error?.message ?? t('selectHelp')}
                error={Boolean(fieldState.error)}
              />
            )}
          />
        )}
      />
      {query.isError && (
        <Alert
          severity="error"
          action={<Button onClick={() => query.refetch()}>{t('retry')}</Button>}
        >
          {t('loadError')}
        </Alert>
      )}
      {query.hasNextPage && (
        <Button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
          {t('loadMore')}
        </Button>
      )}
    </Stack>
  )
}
