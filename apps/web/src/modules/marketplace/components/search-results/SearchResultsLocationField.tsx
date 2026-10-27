'use client'

import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import type { SearchResultsLocationFieldProps } from '../../types/search'
import { styles } from '../../styles/search-results-location-field.styles'

export function SearchResultsLocationField({
  locationQuery,
  setLocationQuery,
}: SearchResultsLocationFieldProps) {
  const t = useTranslations('marketplace.searchResults.filters')

  return (
    <TextField
      fullWidth
      value={locationQuery}
      placeholder={t('allRegions')}
      onChange={(event) => setLocationQuery(event.target.value)}
      size="small"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={styles.searchRoundedIcon} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={t('clearSearch')}
                size="small"
                onClick={() => setLocationQuery('')}
              >
                <CloseRoundedIcon sx={styles.closeRoundedIcon} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={styles.textField}
    />
  )
}
