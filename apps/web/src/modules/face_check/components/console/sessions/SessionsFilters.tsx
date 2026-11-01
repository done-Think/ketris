'use client'

import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Chip, InputAdornment, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'

import { sessionSearchSchema, type SessionSearchFormValues } from '../../../schemas/console.schemas'
import type { SessionsFiltersProps } from '../../../types/console.types'
import { sessionFilters } from '../../../utils/session-list-params'
import { sessionsStyles as styles } from '../../../styles/console.styles'

export function SessionsFilters({ params, counts, onChange }: SessionsFiltersProps) {
  const t = useTranslations('face_check.console.sessions')
  const { control, handleSubmit } = useForm<SessionSearchFormValues>({
    resolver: zodResolver(sessionSearchSchema),
    defaultValues: { search: params.search },
  })
  const onSearch = handleSubmit((values) => onChange({ search: values.search, page: 0 }))

  return (
    <Box sx={styles.toolbar}>
      <Box role="tablist" aria-label={t('filtersLabel')} sx={styles.chips}>
        {sessionFilters.map((filter) => (
          <Chip
            key={filter}
            role="tab"
            aria-selected={params.filter === filter}
            label={t('filterChip', { label: t(`filters.${filter}`), count: counts?.[filter] ?? 0 })}
            onClick={() => onChange({ filter, page: 0 })}
            sx={styles.chip(params.filter === filter)}
          />
        ))}
      </Box>
      <Box component="form" role="search" onSubmit={onSearch} sx={styles.search}>
        <Controller
          control={control}
          name="search"
          render={({ field }) => (
            <TextField
              {...field}
              size="small"
              fullWidth
              type="search"
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchLabel')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />
      </Box>
    </Box>
  )
}
