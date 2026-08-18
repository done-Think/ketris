'use client'

import { Button, IconButton, Stack } from '@mui/material'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'

import { alpha, componentText, iconSize, radius, surface } from '@shared/theme/tokens'

export function SearchResultsPagination() {
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 2.4 }}>
      <IconButton
        aria-label="Filtros"
        sx={{
          display: { xs: 'inline-flex', lg: 'none' },
          width: 38,
          height: 38,
          borderRadius: radius.full,
          bgcolor: surface.paper,
          boxShadow: `0 8px 20px ${alpha.graphite[8]}`,
        }}
      >
        <FilterListRoundedIcon sx={{ fontSize: iconSize.md }} />
      </IconButton>
      {[1, 2, 3].map((page) => (
        <Button
          key={page}
          size="small"
          sx={{
            minWidth: 34,
            width: 34,
            height: 34,
            borderRadius: radius.full,
            color: page === 1 ? surface.lightText : 'text.secondary',
            bgcolor: page === 1 ? 'primary.main' : 'transparent',
            ...componentText.resetButtonText,
            '&:hover': {
              bgcolor: page === 1 ? 'primary.dark' : alpha.magenta[6],
            },
          }}
        >
          {page}
        </Button>
      ))}
    </Stack>
  )
}
