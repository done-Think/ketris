'use client'

import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import { Button, Stack } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { getFilterButtonStyles } from '../../styles/search-results-filters.styles'
import type { SearchResultsFilterButtonProps, SearchResultsFiltersProps } from '../../types/search'
import { SearchResultsFilterDialog } from './SearchResultsFilterDialog'
import { SearchResultsLocationField } from './SearchResultsLocationField'

export function SearchResultsFilters({
  locationQuery,
  setLocationQuery,
}: SearchResultsFiltersProps) {
  return (
    <SearchResultsLocationField locationQuery={locationQuery} setLocationQuery={setLocationQuery} />
  )
}

export function SearchResultsFilterButton({
  filters,
  activeFiltersCount,
  onApply,
}: SearchResultsFilterButtonProps) {
  const t = useTranslations('marketplace.searchResults.filters')
  const [open, setOpen] = useState(false)
  const active = activeFiltersCount > 0

  return (
    <>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button
          variant={active ? 'contained' : 'outlined'}
          startIcon={<TuneRoundedIcon />}
          onClick={() => setOpen(true)}
          sx={getFilterButtonStyles(active)}
        >
          {active ? t('buttonWithCount', { count: activeFiltersCount }) : t('button')}
        </Button>
      </Stack>
      <SearchResultsFilterDialog
        open={open}
        filters={filters}
        onClose={() => setOpen(false)}
        onApply={(values) => {
          onApply(values)
          setOpen(false)
        }}
      />
    </>
  )
}
