'use client'
import { Alert, Autocomplete, Button, CircularProgress, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import type { CrmAutocompleteProps } from '../types/autocomplete'

export function CrmAutocomplete<T extends { id: string }>({
  value,
  options,
  onChange,
  onSearch,
  getOptionLabel,
  label,
  required,
  loading,
  loadError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRetry,
  error,
  helperText,
}: CrmAutocompleteProps<T>) {
  const t = useTranslations('crm.autocomplete')
  return (
    <Stack spacing={1}>
      <Autocomplete
        value={value}
        options={options}
        onChange={(_event, next) => onChange(next)}
        onInputChange={(_event, next, reason) => {
          if (reason === 'input' || reason === 'clear') onSearch(next)
        }}
        filterOptions={(items) => items}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        getOptionKey={(option) => option.id}
        getOptionLabel={getOptionLabel}
        loading={loading}
        loadingText={t('loading')}
        noOptionsText={t('empty')}
        clearText={t('clear')}
        openText={t('open')}
        closeText={t('close')}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={error}
            helperText={helperText}
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
      {loadError && (
        <Alert severity="error" action={<Button onClick={onRetry}>{t('retry')}</Button>}>
          {t('loadError')}
        </Alert>
      )}
      {hasNextPage && (
        <Button disabled={isFetchingNextPage} onClick={onLoadMore}>
          {t('loadMore')}
        </Button>
      )}
    </Stack>
  )
}
