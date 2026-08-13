'use client'

import { IconButton, InputAdornment, TextField } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

import { iconSize, radius, surface } from '@shared/theme/tokens'

import type { SearchResultsLocationFieldProps } from '../../types/search-results'

export function SearchResultsLocationField({
  locationQuery,
  setLocationQuery,
}: SearchResultsLocationFieldProps) {
  return (
    <TextField
      fullWidth
      value={locationQuery || 'Todas as regiões'}
      size="small"
      InputProps={{
        readOnly: true,
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon sx={{ color: 'text.primary', fontSize: iconSize.lg }} />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton aria-label="Limpar busca" size="small" onClick={() => setLocationQuery('')}>
              <CloseRoundedIcon sx={{ fontSize: iconSize.sm }} />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{
        mb: 2,
        '& .MuiOutlinedInput-root': {
          minHeight: 48,
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.paper,
          fontWeight: 700,
        },
      }}
    />
  )
}
